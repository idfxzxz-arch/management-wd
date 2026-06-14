import AppRoutes from "./routes/AppRoutes";
import { AppDataProvider } from "./data/AppDataProvider";

export default function App() {
  return (
    <AppDataProvider>
      <AppRoutes />
    </AppDataProvider>
  );
}
