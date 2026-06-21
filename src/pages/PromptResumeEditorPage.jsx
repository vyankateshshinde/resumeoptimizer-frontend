import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

const PromptResumeEditorPage = () => {
  const [currentResumeText, setCurrentResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [userPrompt, setUserPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRefineResume = async () => {
    if (!currentResumeText || !userPrompt) {
      alert("Resume text and prompt are required");
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post(
        "/api/prompt-editor/refine",
        {
          currentResumeText,
          jobDescription,
          userPrompt,
        }
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to refine resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Prompt Based Resume Editor
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="space-y-4">

          <div>
            <label className="block font-semibold mb-2">
              Current Resume Text
            </label>
            <textarea
              rows={12}
              value={currentResumeText}
              onChange={(e) => setCurrentResumeText(e.target.value)}
              className="w-full border rounded-lg p-3"
              placeholder="Paste current resume text..."
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Job Description
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full border rounded-lg p-3"
              placeholder="Paste job description..."
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Prompt
            </label>
            <textarea
              rows={4}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full border rounded-lg p-3"
              placeholder="Example: Remove Kubernetes because I don't know it and improve summary"
            />
          </div>

          <button
            onClick={handleRefineResume}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            {loading ? "Refining..." : "Refine Resume"}
          </button>
        </div>

        <div>

          {result && (
            <div className="border rounded-lg p-4 bg-white shadow">

              <h2 className="text-xl font-bold mb-4">
                Refined Resume
              </h2>

              <div className="mb-3">
                <strong>Detected Intent:</strong>{" "}
                {result.detectedIntent}
              </div>

              <div className="mb-3">
                <strong>Modified Section:</strong>{" "}
                {result.modifiedSection}
              </div>

              <div className="mb-4">
                <strong>Change Summary:</strong>{" "}
                {result.changeSummary}
              </div>

              <textarea
                rows={20}
                value={result.updatedResumeText}
                readOnly
                className="w-full border rounded-lg p-3"
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PromptResumeEditorPage;