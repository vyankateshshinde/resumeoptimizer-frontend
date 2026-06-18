import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";

const ResumeUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploadedResume, setUploadedResume] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a resume file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/api/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadedResume(res.data);
      toast.success("Resume uploaded successfully");
    } catch (error) {
      toast.error("Resume upload failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <Link to="/dashboard" className="text-blue-600 font-semibold">
        ← Back to Dashboard
      </Link>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8 mt-8">
        <h1 className="text-3xl font-bold">Upload Resume</h1>
        <p className="text-slate-500 mt-2">Upload PDF or DOCX resume for analysis.</p>

        <form onSubmit={handleUpload} className="mt-8 space-y-5">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full border p-4 rounded-xl bg-slate-50"
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">
            Upload Resume
          </button>
        </form>

        {uploadedResume && (
          <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded-xl">
            <p className="font-semibold text-green-700">Upload Successful</p>
            <p className="text-sm mt-1">Resume ID: {uploadedResume.id}</p>
            <p className="text-sm">File Name: {uploadedResume.fileName}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploadPage;