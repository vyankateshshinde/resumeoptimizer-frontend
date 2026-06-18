import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import AtsAnalysisPage from "./pages/AtsAnalysisPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/upload-resume" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
      <Route path="/ats-analysis" element={<ProtectedRoute><AtsAnalysisPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;