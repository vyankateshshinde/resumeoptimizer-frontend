import { Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

<Route
  path="/resume-versions"
  element={
    <ProtectedRoute>
      <AppLayout>
        <ResumeVersionsPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>
      <Route
        path="/upload-resume"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ResumeUploadPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
  path="/resume-builder"
  element={
    <ProtectedRoute>
      <AppLayout>
        <ResumeBuilderPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>

      <Route
        path="/ats-analysis"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AtsAnalysisPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ats-history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AtsHistoryPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-recommendations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AiRecommendationsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/prompt-editor"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PromptResumeEditorPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;