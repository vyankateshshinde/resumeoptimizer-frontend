import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import AtsAnalysisPage from "./pages/AtsAnalysisPage";
import AtsHistoryPage from "./pages/AtsHistoryPage";
import AiRecommendationsPage from "./pages/AiRecommendationsPage";
import PromptResumeEditorPage from "./pages/PromptResumeEditorPage";
import ResumeVersionsPage from "./pages/ResumeVersionsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/resume-builder" element={<ResumeBuilderPage />} />
        <Route path="/upload-resume" element={<ResumeUploadPage />} />
        <Route path="/ats-analysis" element={<AtsAnalysisPage />} />
        <Route path="/ats-history" element={<AtsHistoryPage />} />
        <Route path="/ai-recommendations" element={<AiRecommendationsPage />} />
        <Route path="/prompt-editor" element={<PromptResumeEditorPage />} />
        <Route path="/resume-versions" element={<ResumeVersionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;