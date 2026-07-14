import {
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BookmarkCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Eye,
  HelpCircle,
  Loader2,
  MapPin,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  getSavedJobs,
  removeSavedJob,
} from "../api/jobFinderApi";

const formatValue = (value) => {
  if (
    value == null ||
    value === ""
  ) {
    return "Not specified";
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatExperienceNumber = (
  value
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
};

const formatExperienceRange = (
  job
) => {
  const minimum =
    formatExperienceNumber(
      job.minimumExperience
    );

  const maximum =
    formatExperienceNumber(
      job.maximumExperience
    );

  if (minimum && maximum) {
    if (minimum === maximum) {
      return `${minimum} years`;
    }

    return `${minimum} - ${maximum} years`;
  }

  if (minimum) {
    return `${minimum}+ years`;
  }

  if (maximum) {
    return `Up to ${maximum} years`;
  }

  return "Not specified";
};

const formatConfidence = (
  value
) => {
  const confidence = Number(value);

  if (
    !Number.isFinite(confidence)
  ) {
    return null;
  }

  const normalized = Math.min(
    Math.max(confidence, 0),
    1
  );

  return `${Math.round(
    normalized * 100
  )}% confidence`;
};

const formatExtractionMethod = (
  value
) => {
  if (
    !value ||
    value === "NOT_PROCESSED"
  ) {
    return null;
  }

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase();
};

const getExperiencePresentation = (
  job
) => {
  const type = String(
    job.experienceRequirementType ||
      "NOT_SPECIFIED"
  )
    .trim()
    .toUpperCase();

  switch (type) {
    case "REQUIRED":
      return {
        className: "required",
        label:
          "Required experience",
        message:
          "Mandatory eligibility requirement.",
        Icon: CheckCircle2,
      };

    case "PREFERRED":
      return {
        className: "preferred",
        label:
          "Preferred experience",
        message:
          "You may still apply below this preference.",
        Icon: Sparkles,
      };

    case "AMBIGUOUS":
      return {
        className: "ambiguous",
        label:
          "Verify experience",
        message:
          "Check the full job description before applying.",
        Icon: AlertTriangle,
      };

    default:
      return {
        className: "unspecified",
        label:
          "Experience not specified",
        message:
          "No reliable experience requirement was detected.",
        Icon: HelpCircle,
      };
  }
};

const SavedExperienceRequirement = ({
  job,
}) => {
  const presentation =
    getExperiencePresentation(job);

  const {
    className,
    label,
    message,
    Icon,
  } = presentation;

  const confidence =
    formatConfidence(
      job.experienceConfidence
    );

  const method =
    formatExtractionMethod(
      job.experienceExtractionMethod
    );

  return (
    <section
      className={`jf-experience-requirement ${className}`}
    >
      <div className="jf-experience-heading">
        <div>
          <Icon size={18} />
          <span>{label}</span>
        </div>

        <strong>
          {formatExperienceRange(job)}
        </strong>
      </div>

      <p>{message}</p>

      {job.experienceEvidence && (
        <blockquote>
          “{job.experienceEvidence}”
        </blockquote>
      )}

      {(confidence || method) && (
        <div className="jf-experience-metadata">
          {confidence && (
            <span>{confidence}</span>
          )}

          {method && (
            <span>
              Extracted by {method}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

const SavedJobsPanel = ({
  refreshKey = 0,
  onViewDetails,
}) => {
  const [savedJobs, setSavedJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    removingJobId,
    setRemovingJobId,
  ] = useState(null);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);

      const data =
        await getSavedJobs();

      setSavedJobs(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to load saved jobs"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedJobs();
  }, [refreshKey]);

  const handleRemove = async (
    jobId
  ) => {
    const confirmed =
      window.confirm(
        "Remove this job from your saved jobs?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingJobId(jobId);

      await removeSavedJob(jobId);

      setSavedJobs((current) =>
        current.filter(
          (savedJob) =>
            Number(
              savedJob.jobId
            ) !== Number(jobId)
        )
      );

      toast.success(
        "Job removed from saved jobs"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to remove saved job"
        )
      );
    } finally {
      setRemovingJobId(null);
    }
  };

  if (loading) {
    return (
      <section className="jf-saved-loading">
        <Loader2
          className="jf-spin"
          size={28}
        />

        <p>
          Loading your saved jobs...
        </p>
      </section>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <section className="jf-saved-empty">
        <BookmarkCheck size={42} />

        <h2>
          No saved jobs yet
        </h2>

        <p>
          Save jobs from your search
          results and they will appear
          here.
        </p>
      </section>
    );
  }

  return (
    <section className="jf-saved-section">
      <div className="jf-saved-heading">
        <div>
          <h2>Saved Jobs</h2>

          <p>
            {savedJobs.length} saved{" "}
            {savedJobs.length === 1
              ? "job"
              : "jobs"}
          </p>
        </div>

        <button
          type="button"
          className="jf-refresh-button"
          onClick={loadSavedJobs}
        >
          Refresh
        </button>
      </div>

      <div className="jf-saved-grid">
        {savedJobs.map(
          (savedJob) => (
            <article
              key={
                savedJob.savedJobId ??
                savedJob.jobId
              }
              className="jf-saved-card"
            >
              <div className="jf-saved-card-heading">
                <div className="jf-saved-company-icon">
                  <BriefcaseBusiness
                    size={23}
                  />
                </div>

                <div>
                  <p>
                    {savedJob.company ||
                      "Company unavailable"}
                  </p>

                  <h3>
                    {savedJob.title ||
                      "Job title unavailable"}
                  </h3>
                </div>
              </div>

              <div className="jf-saved-meta">
                <span>
                  <MapPin size={15} />

                  {savedJob.location ||
                    "Location not specified"}
                </span>

                <span>
                  {formatValue(
                    savedJob.workArrangement
                  )}
                </span>

                <span>
                  {formatValue(
                    savedJob.employmentType
                  )}
                </span>
              </div>

              <SavedExperienceRequirement
                job={savedJob}
              />

              <div className="jf-saved-dates">
                <span>
                  Posted:{" "}

                  <strong>
                    {formatDate(
                      savedJob.postedAt
                    )}
                  </strong>
                </span>

                <span>
                  Saved:{" "}

                  <strong>
                    {formatDate(
                      savedJob.savedAt
                    )}
                  </strong>
                </span>
              </div>

              <div className="jf-saved-actions">
                <button
                  type="button"
                  className="jf-saved-details-button"
                  onClick={() =>
                    onViewDetails?.(
                      savedJob.jobId
                    )
                  }
                >
                  <Eye size={17} />
                  Details
                </button>

                <button
                  type="button"
                  className="jf-remove-button"
                  disabled={
                    removingJobId ===
                    savedJob.jobId
                  }
                  onClick={() =>
                    handleRemove(
                      savedJob.jobId
                    )
                  }
                >
                  {removingJobId ===
                  savedJob.jobId ? (
                    <Loader2
                      className="jf-spin"
                      size={17}
                    />
                  ) : (
                    <Trash2
                      size={17}
                    />
                  )}

                  {removingJobId ===
                  savedJob.jobId
                    ? "Removing..."
                    : "Remove"}
                </button>

                {savedJob.applyUrl && (
                  <a
                    className="jf-apply-button"
                    href={
                      savedJob.applyUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply
                    <ExternalLink
                      size={16}
                    />
                  </a>
                )}
              </div>
            </article>
          )
        )}
      </div>
    </section>
  );
};

export default SavedJobsPanel;