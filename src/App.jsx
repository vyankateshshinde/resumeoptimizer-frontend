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

import JobFinderPage from "./features/jobFinder/JobFinderPage";

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected application routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route
          path="/resume-builder"
          element={<ResumeBuilderPage />}
        />

        <Route
          path="/upload-resume"
          element={<ResumeUploadPage />}
        />

        <Route
          path="/ats-analysis"
          element={<AtsAnalysisPage />}
        />

        <Route
          path="/ats-history"
          element={<AtsHistoryPage />}
        />

        <Route
          path="/prompt-editor"
          element={<PromptResumeEditorPage />}
        />

        <Route
          path="/resume-versions"
          element={<ResumeVersionsPage />}
        />

        <Route
          path="/job-finder"
          element={<JobFinderPage />}
        />
      </Route>

      {/* Default redirects */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
};

export default App;