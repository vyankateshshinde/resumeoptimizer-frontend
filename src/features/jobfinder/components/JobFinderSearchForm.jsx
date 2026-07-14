import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { getUserStorageItem } from "../../../utils/userStorage";

const WORK_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
];

const SORT_OPTIONS = [
  { value: "BEST_MATCH", label: "Best match" },
  { value: "NEWEST", label: "Newest" },
  { value: "SALARY_HIGH_TO_LOW", label: "Salary: high to low" },
  { value: "EXPERIENCE_LOW_TO_HIGH", label: "Experience: low to high" },
];

const splitValues = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const findStoredResumeId = () => {
  try {
    const stored = JSON.parse(getUserStorageItem("selectedResume") || "null");
    return stored?.id ?? stored?.resumeId ?? "";
  } catch {
    return "";
  }
};

const JobFinderSearchForm = ({ loading, onSearch }) => {
  const storedResumeId = useMemo(findStoredResumeId, []);
  const [resumeId, setResumeId] = useState(storedResumeId);
  const [titles, setTitles] = useState("Java Developer, Backend Developer");
  const [locations, setLocations] = useState("");
  const [workArrangements, setWorkArrangements] = useState(["REMOTE", "HYBRID"]);
  const [experienceYears, setExperienceYears] = useState("");
  const [postedWithinDays, setPostedWithinDays] = useState(7);
  const [minimumMatchPercentage, setMinimumMatchPercentage] = useState(0);
  const [sortBy, setSortBy] = useState("BEST_MATCH");

  const toggleWorkArrangement = (value) => {
    setWorkArrangements((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSearch({
      resumeId: Number(resumeId),
      jobTitles: splitValues(titles).slice(0, 5),
      locations: splitValues(locations).slice(0, 10),
      workArrangements,
      employmentTypes: ["FULL_TIME"],
      experienceYears:
        experienceYears === "" ? null : Number(experienceYears),
      postedWithinDays: Number(postedWithinDays),
      minimumSalary: null,
      minimumMatchPercentage: Number(minimumMatchPercentage),
      sortBy,
      page: 0,
      size: 20,
    });
  };

  return (
    <form className="jf-search-card" onSubmit={handleSubmit}>
      <div className="jf-section-title">
        <SlidersHorizontal size={19} />
        Search preferences
      </div>

      <div className="jf-form-grid">
        <label>
          <span>Resume ID</span>
          <input
            type="number"
            min="1"
            required
            value={resumeId}
            onChange={(event) => setResumeId(event.target.value)}
            placeholder="Upload/select a resume first"
          />
        </label>

        <label className="jf-wide">
          <span>Desired job titles (maximum 5)</span>
          <input
            required
            value={titles}
            onChange={(event) => setTitles(event.target.value)}
            placeholder="Java Developer, Backend Developer"
          />
        </label>

        <label className="jf-wide">
          <span>Locations</span>
          <input
            value={locations}
            onChange={(event) => setLocations(event.target.value)}
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
            onChange={(event) => setExperienceYears(event.target.value)}
            placeholder="3"
          />
        </label>

        <label>
          <span>Posted within</span>
          <select
            value={postedWithinDays}
            onChange={(event) => setPostedWithinDays(event.target.value)}
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
              setMinimumMatchPercentage(event.target.value)
            }
          >
            {[0, 40, 50, 60, 70, 80, 90].map((score) => (
              <option key={score} value={score}>
                {score === 0 ? "Any match" : `${score}% and above`}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Sort results</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
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
                workArrangements.includes(option.value) ? "selected" : ""
              }
              onClick={() => toggleWorkArrangement(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button className="jf-search-button" type="submit" disabled={loading}>
        <Search size={19} />
        {loading ? "Finding matching jobs..." : "Find matching jobs"}
      </button>
    </form>
  );
};

export default JobFinderSearchForm;
