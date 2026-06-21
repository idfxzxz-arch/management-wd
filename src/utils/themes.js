export const APP_THEMES = [
  { id: "navy", label: "Navy", color: "#12305a", soft: "#d9eaff" },
  { id: "emerald", label: "Emerald", color: "#047857", soft: "#d1fae5" },
  { id: "violet", label: "Violet", color: "#6d28d9", soft: "#ede9fe" },
  { id: "rose", label: "Rose", color: "#be123c", soft: "#ffe4e6" },
  { id: "amber", label: "Amber", color: "#b45309", soft: "#fef3c7" },
];

export function validTheme(value) {
  return APP_THEMES.some((theme) => theme.id === value) ? value : "navy";
}
