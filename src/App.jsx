import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AtsAnalysisPage from "./pages/AtsAnalysisPage";
import AtsHistoryPage from "./pages/AtsHistoryPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PromptResumeEditorPage from "./pages/PromptResumeEditorPage";
import RegisterPage from "./pages/RegisterPage";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import ResumeVersionsPage from "./pages/ResumeVersionsPage";

const ProtectedLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/resume-builder" element={<ResumeBuilderPage />} />
        <Route path="/upload-resume" element={<ResumeUploadPage />} />
        <Route path="/ats-analysis" element={<AtsAnalysisPage />} />
        <Route path="/ats-history" element={<AtsHistoryPage />} />
        <Route path="/prompt-editor" element={<PromptResumeEditorPage />} />
        <Route path="/resume-versions" element={<ResumeVersionsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
