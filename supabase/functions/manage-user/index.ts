import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedManagers = new Set(["Owner", "Wakil Owner", "Developer"]);
const allowedRoles = new Set(["Owner", "Kepala Divisi", "Staff", "Magang", "Wakil Owner", "Developer", "HRD"]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method tidak didukung." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization") || "";
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Secret SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia." }, 500);
    }
    if (!authorization.startsWith("Bearer ")) return json({ error: "Session login tidak aktif." }, 401);

    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user?.email) return json({ error: "Session login tidak valid." }, 401);

    const { data: actor, error: actorError } = await adminClient
      .from("app_users")
      .select("id, name, email, role, status")
      .eq("email", authData.user.email)
      .maybeSingle();
    if (actorError) return json({ error: actorError.message }, 500);
    if (!actor || actor.status !== "Aktif" || !allowedManagers.has(actor.role)) {
      return json({ error: "Hanya Owner, Wakil Owner, atau Developer aktif yang dapat membuat user." }, 403);
    }

    const body = await request.json();
    const action = String(body.action || "create");

    if (action === "delete") {
      const targetEmail = String(body.email || "").trim().toLowerCase();
      const targetId = String(body.id || "").trim();
      if (!targetEmail && !targetId) return json({ error: "Email atau ID user wajib diisi." }, 400);
      if (targetEmail && targetEmail === actor.email.toLowerCase()) {
        return json({ error: "Anda tidak dapat menghapus akun login sendiri." }, 400);
      }

      let query = adminClient.from("app_users").select("id, name, email, role").limit(1);
      query = targetEmail ? query.eq("email", targetEmail) : query.eq("id", targetId);
      const { data: targetRows, error: targetError } = await query;
      if (targetError) return json({ error: targetError.message }, 500);
      const target = targetRows?.[0];
      if (!target?.email) return json({ error: "User tidak ditemukan." }, 404);

      const { data: authList, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      const authUser = (authList.users || []).find((user) => user.email?.toLowerCase() === target.email.toLowerCase());
      if (authUser?.id) {
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(authUser.id);
        if (deleteAuthError) throw deleteAuthError;
      }

      const { error: deleteProfileError } = await adminClient.from("app_users").delete().eq("id", target.id);
      if (deleteProfileError) throw deleteProfileError;

      await adminClient.from("activity_logs").insert({
        actor: actor.name || actor.email,
        division_id: "all",
        action: `menghapus login user "${target.name}" (${target.email})`,
        time: new Date().toISOString().slice(0, 16).replace("T", " "),
        severity: "warning",
      });

      return json({ ok: true, deleted: { id: target.id, email: target.email, role: target.role } });
    }

    if (action !== "create") return json({ error: "Aksi tidak didukung." }, 400);

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "").trim();
    const divisionId = String(body.divisionId || "all").trim() || "all";
    const position = String(body.position || role).trim() || role;
    const password = String(body.password || "123456");
    const status = String(body.status || "Aktif");

    if (!name || !email || !role) return json({ error: "Nama, email, dan role wajib diisi." }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Format email tidak valid." }, 400);
    if (password.length < 6) return json({ error: "Password minimal 6 karakter." }, 400);
    if (!allowedRoles.has(role)) return json({ error: "Role tidak valid." }, 400);
    if (!["Aktif", "Nonaktif"].includes(status)) return json({ error: "Status tidak valid." }, 400);

    let employeeId = await upsertEmployee(adminClient, { name, email, role, divisionId, position, status });
    const appUserId = makeAppUserId(role, employeeId);
    await upsertAppUser(adminClient, { id: appUserId, name, email, role, divisionId, status, employeeId });
    await upsertAuthUser(adminClient, { id: appUserId, name, email, role, divisionId, employeeId, password });

    await adminClient.from("password_events").insert({
      app_user_id: appUserId,
      email,
      event: "temporary_created",
    });

    await adminClient.from("activity_logs").insert({
      actor: actor.name || actor.email,
      division_id: divisionId,
      action: `membuat user "${name}" (${role})`,
      time: new Date().toISOString().slice(0, 16).replace("T", " "),
      severity: "owner",
    });

    return json({ ok: true, email, password, role, employeeId, appUserId });
  } catch (error) {
    return json({ error: error.message || "Gagal membuat user." }, 500);
  }
});

async function upsertEmployee(client, { name, email, role, divisionId, position, status }) {
  const { data: existing, error: readError } = await client
    .from("employees")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (readError) throw readError;

  if (existing?.id) {
    const { data, error } = await client
      .from("employees")
      .update({ name, email, position, division_id: divisionId, role, status })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  const { data, error } = await client
    .from("employees")
    .insert({ name, email, position, division_id: divisionId, role, status, joined_at: new Date().toISOString().slice(0, 10) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertAppUser(client, { id, name, email, role, divisionId, status, employeeId }) {
  const { error } = await client.from("app_users").upsert({
    id,
    name,
    email,
    role,
    division_id: divisionId,
    status,
    employee_id: employeeId,
    must_change_password: true,
    password_set_at: null,
  }, { onConflict: "email" });
  if (error) throw error;
}

async function upsertAuthUser(client, { id, name, email, role, divisionId, employeeId, password }) {
  const { data, error: listError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = (data.users || []).find((user) => user.email?.toLowerCase() === email);
  const userMetadata = { name, role, division_id: divisionId, employee_id: employeeId, app_user_id: id };

  if (existing?.id) {
    const { error } = await client.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}), ...userMetadata },
    });
    if (error) throw error;
    return;
  }

  const { error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (error) throw error;
}

function makeAppUserId(role, employeeId) {
  const prefixByRole = {
    Owner: "owner",
    "Wakil Owner": "deputy-owner",
    Developer: "developer",
    HRD: "hrd",
    "Kepala Divisi": "head",
    Staff: "staff",
    Magang: "intern",
  };
  return `${prefixByRole[role] || "user"}-${employeeId}`;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
