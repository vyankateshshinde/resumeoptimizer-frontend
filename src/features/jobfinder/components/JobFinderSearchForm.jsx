import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FileText,
  Search,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";

import axiosInstance from "../../../api/axiosInstance";
import {
  getUserStorageItem,
  setUserStorageItem,
} from "../../../utils/userStorage";

const WORK_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
];

const SORT_OPTIONS = [
  { value: "BEST_MATCH", label: "Best match" },
  { value: "NEWEST", label: "Newest" },
  { value: "SALARY_HIGH_TO_LOW", label: "Salary: high to low" },
  {
    value: "EXPERIENCE_LOW_TO_HIGH",
    label: "Experience: low to high",
  },
];

const splitValues = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const JobFinderSearchForm = ({ loading, onSearch }) => {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [resumesLoading, setResumesLoading] = useState(true);

  const [titles, setTitles] = useState(
    "Java Developer, Backend Developer"
  );
  const [locations, setLocations] = useState("");
  const [workArrangements, setWorkArrangements] = useState([
    "REMOTE",
    "HYBRID",
  ]);
  const [experienceYears, setExperienceYears] = useState("");
  const [postedWithinDays, setPostedWithinDays] = useState(7);
  const [minimumMatchPercentage, setMinimumMatchPercentage] =
    useState(0);
  const [sortBy, setSortBy] = useState("BEST_MATCH");

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setResumesLoading(true);

        const response = await axiosInstance.get(
          "/api/resume/my-resumes"
        );

        const uploadedResumes = Array.isArray(response.data)
          ? response.data
          : [];

        setResumes(uploadedResumes);

        const storedResume = safeJsonParse(
          getUserStorageItem("selectedResume")
        );

        const storedResumeId = Number(
          storedResume?.id ?? storedResume?.resumeId ?? 0
        );

        const storedResumeExists = uploadedResumes.some(
          (resume) => Number(resume.id) === storedResumeId
        );

        if (storedResumeExists) {
          setResumeId(String(storedResumeId));
        } else if (uploadedResumes.length > 0) {
          const firstResume = uploadedResumes[0];

          setResumeId(String(firstResume.id));
          setUserStorageItem(
            "selectedResume",
            JSON.stringify(firstResume)
          );
        } else {
          setResumeId("");
        }
      } catch (error) {
        console.error(error);
        setResumes([]);
        setResumeId("");
        toast.error("Unable to load your uploaded resumes");
      } finally {
        setResumesLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const handleResumeChange = (event) => {
    const selectedId = event.target.value;

    setResumeId(selectedId);

    const selectedResume = resumes.find(
      (resume) => Number(resume.id) === Number(selectedId)
    );

    if (selectedResume) {
      setUserStorageItem(
        "selectedResume",
        JSON.stringify(selectedResume)
      );
    }
  };

  const toggleWorkArrangement = (value) => {
    setWorkArrangements((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!resumeId) {
      toast.error("Please upload or select a resume first");
      return;
    }

    const jobTitles = splitValues(titles).slice(0, 5);

    if (jobTitles.length === 0) {
      toast.error("Please enter at least one desired job title");
      return;
    }

    onSearch({
      resumeId: Number(resumeId),
      jobTitles,
      locations: splitValues(locations).slice(0, 10),
      workArrangements,
      employmentTypes: ["FULL_TIME"],
      experienceYears:
        experienceYears === ""
          ? null
          : Number(experienceYears),
      postedWithinDays: Number(postedWithinDays),
      minimumSalary: null,
      minimumMatchPercentage: Number(
        minimumMatchPercentage
      ),
      sortBy,
      page: 0,
      size: 20,
    });
  };

  return (
    <form
      className="jf-search-card"
      onSubmit={handleSubmit}
    >
      <div className="jf-section-title">
        <SlidersHorizontal size={19} />
        Search preferences
      </div>

      <div className="jf-form-grid">
        <div className="jf-resume-section jf-wide">
          <span className="jf-resume-label">
            <FileText size={15} />
            Select resume
          </span>

          {resumesLoading ? (
            <div className="jf-resume-loading">
              Loading your uploaded resumes...
            </div>
          ) : resumes.length > 0 ? (
            <select
              value={resumeId}
              onChange={handleResumeChange}
              required
            >
              <option value="">
                Select an uploaded resume
              </option>

              {resumes.map((resume) => (
                <option
                  key={resume.id}
                  value={resume.id}
                >
                  {resume.fileName ||
                    `Resume #${resume.id}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="jf-no-resume">
              <UploadCloud size={25} />

              <div>
                <strong>No resume uploaded</strong>
                <p>
                  Upload a resume before searching for
                  matching jobs.
                </p>
              </div>

              <Link to="/upload-resume">
                Upload Resume
              </Link>
            </div>
          )}
        </div>

        <label className="jf-wide">
          <span>Desired job titles (maximum 5)</span>
          <input
            required
            value={titles}
            onChange={(event) =>
              setTitles(event.target.value)
            }
            placeholder="Java Developer, Backend Developer"
          />
        </label>

        <label className="jf-wide">
          <span>Locations</span>
          <input
            value={locations}
            onChange={(event) =>
              setLocations(event.target.value)
            }
            placeholder="Pune, Bengaluru, Hyderabad"
          />
        </label>

        <label>
          <span>Experience (years)</span>
          <input
            type="number"
            min="0"
            max="60"
            step="0.5"
            value={experienceYears}
            onChange={(event) =>
              setExperienceYears(event.target.value)
            }
            placeholder="3"
          />
        </label>

        <label>
          <span>Posted within</span>
          <select
            value={postedWithinDays}
            onChange={(event) =>
              setPostedWithinDays(event.target.value)
            }
          >
            {[1, 2, 3, 5, 7, 14, 30].map((days) => (
              <option key={days} value={days}>
                Last {days} day{days > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Minimum match</span>
          <select
            value={minimumMatchPercentage}
            onChange={(event) =>
              setMinimumMatchPercentage(
                event.target.value
              )
            }
          >
            {[0, 40, 50, 60, 70, 80, 90].map(
              (score) => (
                <option key={score} value={score}>
                  {score === 0
                    ? "Any match"
                    : `${score}% and above`}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span>Sort results</span>
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="jf-work-options">
        <span>Work mode</span>

        <div>
          {WORK_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                workArrangements.includes(option.value)
                  ? "selected"
                  : ""
              }
              onClick={() =>
                toggleWorkArrangement(option.value)
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        className="jf-search-button"
        type="submit"
        disabled={
          loading ||
          resumesLoading ||
          !resumeId ||
          resumes.length === 0
        }
      >
        <Search size={19} />

        {loading
          ? "Finding matching jobs..."
          : "Find matching jobs"}
      </button>
    </form>
  );
};

export default JobFinderSearchForm;