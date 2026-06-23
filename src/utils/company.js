export const OWNER_NAME = "Wildan Deni Fahrezi";

export function displayPersonName(name, role) {
  return role === "Owner" ? OWNER_NAME : name;
}
