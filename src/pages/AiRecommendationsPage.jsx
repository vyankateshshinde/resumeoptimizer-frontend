import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AiRecommendationsPage = () => {
  const [atsResult, setAtsResult] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedAtsResult = localStorage.getItem("latestAtsResult");
    const savedJobDescription = localStorage.getItem("latestJobDescription");

    if (savedAtsResult) {
      setAtsResult(JSON.parse(savedAtsResult));
    }

    if (savedJobDescription) {
      setJobDescription(savedJobDescription);
    }
  }, []);

  const generateRecommendations = async () => {
    if (!atsResult) {
      alert("Please complete ATS analysis first.");
      return;
    }

    try {
      setLoading(true);
const resumeId = atsResult?.resumeId || atsResult?.id;

if (!resumeId) {
  alert("Resume ID not found. Please run ATS Analysis again.");
  return;
}

const response = await axiosInstance.post("/api/ai/recommendation", {
  resumeId,
  jobDescription,
  atsScore: atsResult.finalScore,
  matchedSkills: atsResult.matchedSkills || [],
  missingSkills: atsResult.missingSkills || [],
});
      
      setRecommendation(response.data);
    } catch (error) {
      console.error("AI recommendation error:", error);
      alert("Failed to generate AI recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    background: "rgba(15,23,42,.95)",
    border: "1px solid rgba(139,92,246,.22)",
    borderRadius: "18px",
    padding: "20px",
    color: "#ffffff",
    marginBottom: "18px",
  };

  const titleStyle = {
    fontSize: "18px",
    fontWeight: 900,
    marginBottom: "10px",
    color: "#c4b5fd",
  };

  return (
    <div>
      <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "20px" }}>
        AI Resume Recommendations
      </h1>

      <div style={cardStyle}>
        <h2 style={titleStyle}>ATS Result Summary</h2>

        {atsResult ? (
          <>
            <p>Final Score: {atsResult.finalScore}%</p>
            <p>Skill Score: {atsResult.skillScore}%</p>
            <p>Keyword Score: {atsResult.keywordScore}%</p>
            <p>
              Missing Skills:{" "}
              {(atsResult.missingSkills || []).length > 0
                ? atsResult.missingSkills.join(", ")
                : "No missing skills found"}
            </p>
          </>
        ) : (
          <p>No ATS result found. Please complete ATS analysis first.</p>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={titleStyle}>Job Description</h2>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste or update job description..."
          rows={8}
          style={{
            width: "100%",
            borderRadius: "12px",
            padding: "14px",
            background: "#020617",
            color: "#ffffff",
            border: "1px solid rgba(139,92,246,.25)",
            resize: "vertical",
          }}
        />

        <button
          onClick={generateRecommendations}
          disabled={loading}
          style={{
            marginTop: "16px",
            padding: "12px 18px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(90deg,#8b5cf6,#4f46e5)",
            color: "#ffffff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Recommendations"}
        </button>
      </div>

      {recommendation && (
        <>
          <div style={cardStyle}>
            <h2 style={titleStyle}>Summary Recommendation</h2>
            <p>{recommendation.summaryRecommendation}</p>
          </div>

          <div style={cardStyle}>
            <h2 style={titleStyle}>Skill Recommendation</h2>
            <p>{recommendation.skillRecommendation}</p>
          </div>

          <div style={cardStyle}>
            <h2 style={titleStyle}>Project Recommendation</h2>
            <p>{recommendation.projectRecommendation}</p>
          </div>

          <div style={cardStyle}>
            <h2 style={titleStyle}>Missing Skills</h2>
            <p>{recommendation.missingSkills}</p>
          </div>

          <div style={cardStyle}>
            <h2 style={titleStyle}>Learning Roadmap</h2>
            <p>{recommendation.learningRoadmap}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AiRecommendationsPage;