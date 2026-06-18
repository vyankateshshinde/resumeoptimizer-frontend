import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";

const AtsAnalysisPage = () => {
  const [resumeId, setResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post(
        `/api/ats/${resumeId}`,
        {
          jobDescription,
        }
      );

      setResult(response.data);
      toast.success("ATS Analysis Completed");
    } catch (error) {
      console.error(error);
      toast.error("Analysis Failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <Link to="/dashboard" className="text-blue-600">
        ← Back to Dashboard
      </Link>

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow mt-6">
        <h1 className="text-3xl font-bold mb-6">
          ATS Resume Analysis
        </h1>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <input
            type="number"
            placeholder="Resume ID"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="w-full border p-3 rounded-xl"
            required
          />

          <textarea
            placeholder="Paste Job Description Here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full border p-3 rounded-xl h-40"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Analyze Resume
          </button>
        </form>

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold">
              ATS Score: {result.finalScore}%
            </h2>

            <div className="mt-4">
              <h3 className="font-bold">Matched Skills</h3>
              <p>{result.matchedSkills?.join(", ")}</p>
            </div>

            <div className="mt-4">
              <h3 className="font-bold">Missing Skills</h3>
              <p>{result.missingSkills?.join(", ")}</p>
            </div>

            <div className="mt-4">
              <h3 className="font-bold">Feedback</h3>
              <p>{result.feedback}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AtsAnalysisPage;