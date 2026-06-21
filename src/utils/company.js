export const OWNER_NAME = "Wildan Deni Fahrezi, S.Pd., M.Pd.";

export function displayPersonName(name, role) {
  return role === "Owner" ? OWNER_NAME : name;
}
