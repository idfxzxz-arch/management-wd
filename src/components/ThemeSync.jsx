import { useEffect } from "react";
import { useAppData } from "../data/AppDataProvider";
import { validTheme } from "../utils/themes";

export default function ThemeSync() {
  const { settings } = useAppData();
  const selected = settings.find((setting) => setting.key === "theme")?.value;

  useEffect(() => {
    document.documentElement.dataset.theme = validTheme(selected);
  }, [selected]);

  return null;
}
