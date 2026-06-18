import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axiosInstance.get("/api/dashboard");
        setDashboard(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Resume Intelligence Platform</h1>
          <p className="text-slate-500 mt-1">Dashboard overview</p>
        </div>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-5 py-2 rounded-xl"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-slate-500">Total Resumes</p>
          <h2 className="text-3xl font-bold">{dashboard?.totalResumes ?? 0}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-slate-500">ATS Analyses</p>
          <h2 className="text-3xl font-bold">{dashboard?.totalAnalyses ?? 0}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-slate-500">Best ATS Score</p>
          <h2 className="text-3xl font-bold">{dashboard?.bestScore ?? 0}%</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-slate-500">Average Score</p>
          <h2 className="text-3xl font-bold">{dashboard?.averageScore ?? 0}%</h2>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/upload-resume" className="bg-blue-600 text-white px-6 py-3 rounded-xl">
          Upload Resume
        </Link>

        <Link to="/ats-analysis" className="bg-slate-900 text-white px-6 py-3 rounded-xl">
          ATS Analysis
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;