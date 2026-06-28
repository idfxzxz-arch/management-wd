import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

loadDotEnv();

const args = parseArgs(process.argv.slice(2));
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = args.password || process.env.AUTH_DEFAULT_PASSWORD || "123456";
const passwordByRole = {
  Owner: args["management-password"] || process.env.AUTH_MANAGEMENT_PASSWORD || defaultPassword,
  "Wakil Owner": args["management-password"] || process.env.AUTH_MANAGEMENT_PASSWORD || defaultPassword,
  "Kepala Divisi": args["head-password"] || process.env.AUTH_HEAD_PASSWORD || defaultPassword,
  Staff: args["staff-password"] || process.env.AUTH_STAFF_PASSWORD || defaultPassword,
  Magang: args["staff-password"] || process.env.AUTH_STAFF_PASSWORD || defaultPassword,
};
const dryRun = Boolean(args["dry-run"]);
const resetExisting = Boolean(args["reset-existing"]);
const onlyEmail = args.email?.toLowerCase();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL/VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.");
  console.error("Contoh: SUPABASE_SERVICE_ROLE_KEY=... npm run auth:create-users -- --password=123456");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let query = supabase
  .from("app_users")
  .select("id, name, email, role, division_id, status, employee_id")
  .eq("status", "Aktif")
  .neq("email", "")
  .order("role")
  .order("name");

if (onlyEmail) query = query.eq("email", onlyEmail);

const { data: appUsers, error: usersError } = await query;

if (usersError) {
  console.error(`Gagal membaca app_users: ${usersError.message}`);
  process.exit(1);
}

const existingUsers = await listExistingAuthUsers();
let created = 0;
let skipped = 0;
let failed = 0;
let reset = 0;

for (const user of appUsers) {
  const email = user.email?.trim().toLowerCase();
  if (!email) continue;

  const userPassword = passwordByRole[user.role] || defaultPassword;
  const existingUser = existingUsers.get(email);
  if (existingUser && resetExisting) {
    if (dryRun) {
      reset += 1;
      console.log(`reset   ${email} (${user.role})`);
      continue;
    }

    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        ...existingUser.user_metadata,
        name: user.name,
        role: user.role,
        division_id: user.division_id,
        employee_id: user.employee_id,
        app_user_id: user.id,
      },
    });

    if (error) {
      failed += 1;
      console.error(`failed  ${email}: ${error.message}`);
      continue;
    }

    reset += 1;
    await markTemporaryPassword(user, "temporary_reset");
    console.log(`reset   ${email} (${user.role})`);
    continue;
  }

  if (existingUser) {
    skipped += 1;
    console.log(`skip    ${email} (sudah ada di Auth)`);
    continue;
  }

  if (dryRun) {
    created += 1;
    console.log(`create  ${email} (${user.role})`);
    continue;
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: userPassword,
    email_confirm: true,
    user_metadata: {
      name: user.name,
      role: user.role,
      division_id: user.division_id,
      employee_id: user.employee_id,
      app_user_id: user.id,
    },
  });

  if (error) {
    failed += 1;
    console.error(`failed  ${email}: ${error.message}`);
    continue;
  }

  created += 1;
  await markTemporaryPassword(user, "temporary_created");
  console.log(`created ${email} (${user.role})`);
}

console.log("");
console.log(`Selesai. created=${created}, reset=${reset}, skipped=${skipped}, failed=${failed}${dryRun ? " (dry run)" : ""}`);

async function listExistingAuthUsers() {
  const usersByEmail = new Map();
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error(`Gagal membaca Auth users: ${error.message}`);
      process.exit(1);
    }

    for (const authUser of data.users || []) {
      if (authUser.email) usersByEmail.set(authUser.email.toLowerCase(), authUser);
    }

    if (!data.users?.length || data.users.length < perPage) break;
  }

  return usersByEmail;
}

async function markTemporaryPassword(user, event) {
  const { error: updateError } = await supabase
    .from("app_users")
    .update({ must_change_password: true, password_set_at: null })
    .eq("id", user.id);

  if (updateError) {
    console.error(`warning ${user.email}: gagal update status password (${updateError.message})`);
    return;
  }

  const { error: insertError } = await supabase
    .from("password_events")
    .insert({ app_user_id: user.id, email: user.email, event });

  if (insertError) {
    console.error(`warning ${user.email}: gagal mencatat password event (${insertError.message})`);
  }
}

function parseArgs(rawArgs) {
  return rawArgs.reduce((result, arg) => {
    if (!arg.startsWith("--")) return result;
    const [key, value] = arg.slice(2).split("=");
    result[key] = value ?? true;
    return result;
  }, {});
}

function loadDotEnv() {
  try {
    const envFile = readFileSync(".env", "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // .env is optional when variables are passed through the shell.
  }
}
