import AppRoutes from "./routes/AppRoutes";
import { AppDataProvider } from "./data/AppDataProvider";
import ThemeSync from "./components/ThemeSync";

export default function App() {
  return (
    <AppDataProvider>
      <ThemeSync />
      <AppRoutes />
    </AppDataProvider>
  );
}
