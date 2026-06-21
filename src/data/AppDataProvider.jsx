import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { displayPersonName } from "../utils/company";
import { getCurrentUser, logout } from "../utils/auth";

const emptyData = {
  users: [],
  divisions: [],
  employees: [],
  tasks: [],
  taskSubmissions: [],
  meetings: [],
  minutes: [],
  reports: [],
  weeklyReports: [],
  announcements: [],
  documents: [],
  activityLogs: [],
  sops: [],
  settings: [],
};

const tableMap = [
  ["users", "app_users", mapUser],
  ["divisions", "divisions", mapDivision],
  ["employees", "employees", mapEmployee],
  ["tasks", "tasks", mapTask],
  ["taskSubmissions", "task_submissions", mapTaskSubmission],
  ["meetings", "meetings", mapMeeting],
  ["minutes", "minutes", mapMinute],
  ["reports", "reports", mapReport],
  ["weeklyReports", "weekly_reports", mapWeeklyReport],
  ["announcements", "announcements", mapAnnouncement],
  ["documents", "documents", mapDocument],
  ["activityLogs", "activity_logs", mapActivityLog],
  ["sops", "sops", mapSop],
  ["settings", "app_settings", mapSetting],
];

const AppDataContext = createContext({
  ...emptyData,
  loading: false,
  error: "",
  reload: () => {},
  divisionName: () => "-",
  employeeName: () => "-",
  scopedByDivision: (items) => items,
});

export function AppDataProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  async function loadData() {
    if (!isSupabaseConfigured) {
      setData(emptyData);
      setLoading(false);
      setError("Koneksi data belum dikonfigurasi. Isi environment variable aplikasi.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setData(emptyData);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    const nextData = { ...emptyData };

    for (const [key, table, mapper] of tableMap) {
      const { data: rows, error: tableError } = await supabase.from(table).select("*");
      if (tableError) {
        setError(tableError.message);
        nextData[key] = [];
      } else {
        nextData[key] = (rows || []).map(mapper);
      }
    }

    const currentUser = getCurrentUser();
    const currentProfile = nextData.users.find((item) => item.email?.toLowerCase() === currentUser?.email?.toLowerCase());
    if (currentProfile && currentProfile.status !== "Aktif") {
      logout();
      setData(emptyData);
      setLoading(false);
      setError("Akun Anda telah dinonaktifkan.");
      return;
    }

    setData(nextData);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    if (!isSupabaseConfigured) return undefined;

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadData();
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => {
    function divisionName(id) {
      if (id === "all") return "Semua Divisi";
      return data.divisions.find((division) => division.id === id)?.name || "-";
    }

    function employeeName(id) {
      return data.employees.find((employee) => String(employee.id) === String(id))?.name || "-";
    }

    function scopedByDivision(items, user) {
      if (!user || user.role === "Owner" || user.role === "Administrator") return items;
      return items.filter((item) => item.divisionId === user.divisionId || item.divisionId === "all");
    }

    return { ...data, loading, error, reload: loadData, divisionName, employeeName, scopedByDivision };
  }, [data, loading, error]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}

function mapUser(row) {
  return {
    id: row.id,
    name: displayPersonName(row.name, row.role),
    email: row.email,
    role: row.role,
    divisionId: row.division_id,
    employeeId: row.employee_id,
    status: row.status,
  };
}

function mapDivision(row) {
  return { id: row.id, name: row.name, head: row.head, members: row.members || 0, description: row.description || "", performance: row.performance || "-" };
}

function mapEmployee(row) {
  return {
    id: row.id,
    name: displayPersonName(row.name, row.role),
    email: row.email,
    position: row.position,
    divisionId: row.division_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  };
}

function mapTask(row) {
  return {
    id: row.id,
    divisionId: row.division_id,
    assigneeId: row.assignee_id,
    assignedBy: row.assigned_by,
    assignedByName: displayPersonName(row.assigned_by_name, row.assigned_by),
    title: row.title,
    description: row.description,
    target: row.target,
    priority: row.priority,
    deadline: row.deadline,
    status: row.status,
    approval: row.approval,
    progress: row.progress || 0,
    note: row.note || "",
    submissionNote: row.submission_note || "",
    submissionFileUrl: row.submission_file_url || "",
    submissionFileName: row.submission_file_name || "",
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by || "",
    history: row.history || [],
  };
}

function mapTaskSubmission(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    taskDescription: row.task_description || "",
    staffName: row.staff_name,
    staffRole: row.staff_role,
    divisionId: row.division_id,
    deadline: row.deadline,
    driveLink: row.drive_link,
    submissionNote: row.submission_note || "",
    submittedAt: row.submitted_at,
    status: row.status,
    headFeedback: row.head_feedback || "",
    reviewerName: displayPersonName(row.reviewed_by || "", row.reviewer_role),
    reviewerRole: row.reviewer_role || "",
    reviewedAt: row.reviewed_at,
    revisionCount: row.revision_count || 0,
    revisionHistory: row.revision_history || [],
  };
}

function mapMeeting(row) {
  return { id: row.id, date: row.date, time: row.time, divisionId: row.division_id, topic: row.topic, participants: row.participants || [], status: row.status };
}

function mapMinute(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    divisionId: row.division_id,
    leader: row.leader,
    participants: row.participants || [],
    discussion: row.discussion || "",
    decision: row.decision || "",
    followUp: row.follow_up || "",
    actionDeadline: row.action_deadline,
  };
}

function mapReport(row) {
  return { id: row.id, employeeId: row.employee_id, staff: row.staff, divisionId: row.division_id, done: row.done || "", blockers: row.blockers || "", next: row.next || "", date: row.date, status: row.status };
}

function mapWeeklyReport(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    week: row.week,
    period: row.period,
    staff: row.staff,
    divisionId: row.division_id,
    completedTasks: row.completed_tasks || 0,
    targetTasks: row.target_tasks || 0,
    averageProgress: row.average_progress || 0,
    lateTasks: row.late_tasks || 0,
    revisionTasks: row.revision_tasks || 0,
    summary: row.summary || "",
    blocker: row.blocker || "",
    nextPlan: row.next_plan || "",
    headNote: row.head_note || "",
    status: row.status,
  };
}

function mapAnnouncement(row) {
  return { id: row.id, title: row.title, content: row.content || "", author: displayPersonName(row.author, row.author === "Arman Wijaya" ? "Owner" : ""), date: row.date, target: row.target, priority: row.priority };
}

function mapDocument(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    divisionId: row.division_id,
    uploadedAt: row.uploaded_at,
    type: row.type,
    fileUrl: row.file_url || "",
    fileName: row.file_name || "",
    filePath: row.file_path || "",
  };
}

function mapActivityLog(row) {
  return { id: row.id, actor: displayPersonName(row.actor, row.severity === "owner" ? "Owner" : ""), divisionId: row.division_id, action: row.action, time: row.time, severity: row.severity };
}

function mapSop(row) {
  return { id: row.id, title: row.title, divisionId: row.division_id, description: row.description || "", updatedAt: row.updated_at, status: row.status };
}

function mapSetting(row) {
  return { key: row.setting_key, value: row.setting_value, updatedAt: row.updated_at };
}
