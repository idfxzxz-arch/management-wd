export const REVIEW_STATUSES = [
  "Belum Dikumpulkan",
  "Menunggu Review",
  "Diterima",
  "Revisi",
  "Terlambat",
  "Revisi Dikirim Ulang",
];

export function isLate(deadline, submittedAt) {
  if (!deadline) return false;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  const compareDate = submittedAt ? new Date(submittedAt) : new Date();
  return compareDate > deadlineDate;
}

export function punctualityLabel(task, submission) {
  if (!submission?.submittedAt) return isLate(task.deadline) ? "Belum dikumpulkan, terlambat" : "Belum dikumpulkan";
  return isLate(task.deadline, submission.submittedAt) ? "Terlambat" : "Tepat waktu";
}

export function buildSubmissionRows(tasks, submissions, helpers = {}) {
  const { employeeName = () => "-", employeeRole = () => "Staff" } = helpers;

  return tasks.map((task) => {
    const submission = submissions.find((item) => String(item.taskId) === String(task.id));
    const late = isLate(task.deadline, submission?.submittedAt);
    const status = submission?.status || (late ? "Terlambat" : "Belum Dikumpulkan");

    return {
      ...submission,
      id: submission?.id || `pending-${task.id}`,
      taskId: task.id,
      taskTitle: submission?.taskTitle || task.title,
      taskDescription: submission?.taskDescription || task.description,
      staffName: submission?.staffName || employeeName(task.assigneeId),
      staffRole: submission?.staffRole || employeeRole(task.assigneeId),
      divisionId: submission?.divisionId || task.divisionId,
      deadline: submission?.deadline || task.deadline,
      driveLink: submission?.driveLink || task.submissionFileUrl || "",
      submissionNote: submission?.submissionNote || task.submissionNote || "",
      submittedAt: submission?.submittedAt || task.submittedAt || "",
      status,
      headFeedback: submission?.headFeedback || "",
      reviewerName: submission?.reviewerName || task.approvedBy || "",
      reviewerRole: submission?.reviewerRole || "",
      reviewedAt: submission?.reviewedAt || task.approvedAt || "",
      revisionCount: submission?.revisionCount || 0,
      revisionHistory: submission?.revisionHistory || [],
      task,
      isLate: late,
      punctuality: punctualityLabel(task, submission),
    };
  });
}

export function submissionStats(rows) {
  const now = new Date();
  return {
    totalTasks: rows.length,
    totalSubmitted: rows.filter((row) => row.submittedAt || row.driveLink).length,
    waitingReview: rows.filter((row) => row.status === "Menunggu Review").length,
    approved: rows.filter((row) => row.status === "Diterima").length,
    revision: rows.filter((row) => row.status === "Revisi").length,
    late: rows.filter((row) => row.isLate || row.status === "Terlambat").length,
    resentRevision: rows.filter((row) => row.status === "Revisi Dikirim Ulang").length,
    doneThisMonth: rows.filter((row) => {
      if (row.status !== "Diterima" || !row.reviewedAt) return false;
      const date = new Date(row.reviewedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };
}
