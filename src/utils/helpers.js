import { divisions } from "../data/divisions";
import { employees } from "../data/employees";

export const roleAccess = {
  Owner: ["Owner"],
  Head: ["Owner", "Kepala Divisi"],
  Staff: ["Owner", "Kepala Divisi", "Staff"],
};

export function divisionName(id) {
  if (id === "all") return "Semua Divisi";
  return divisions.find((division) => division.id === id)?.name || "-";
}

export function employeeName(id) {
  return employees.find((employee) => employee.id === id)?.name || "-";
}

export function scopedByDivision(items, user) {
  if (!user || user.role === "Owner" || user.divisionId === "all") return items;
  return items.filter((item) => item.divisionId === user.divisionId || item.divisionId === "all");
}

export function currencyDate(value) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function contains(value, query) {
  return String(value).toLowerCase().includes(query.toLowerCase());
}
