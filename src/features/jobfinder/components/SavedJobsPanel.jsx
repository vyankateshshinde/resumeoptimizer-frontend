import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BookmarkCheck,
  BriefcaseBusiness,
  ExternalLink,
  Loader2,
  MapPin,
  Trash2,
} from "lucide-react";

import {
  getSavedJobs,
  removeSavedJob,
} from "../api/jobFinderApi";

const formatValue = (value) => {
  if (!value) {
    return "Not specified";
  }

  return String(value)
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

const SavedJobsPanel = ({ refreshKey = 0 }) => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingJobId, setRemovingJobId] =
    useState(null);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);

      const data = await getSavedJobs();

      setSavedJobs(Array.isArray(data) ? data : []);
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

  const handleRemove = async (jobId) => {
    const confirmed = window.confirm(
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
            Number(savedJob.jobId) !== Number(jobId)
        )
      );

      toast.success("Job removed from saved jobs");
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
        <Loader2 className="jf-spin" size={28} />
        <p>Loading your saved jobs...</p>
      </section>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <section className="jf-saved-empty">
        <BookmarkCheck size={42} />

        <h2>No saved jobs yet</h2>

        <p>
          Save jobs from your search results and they
          will appear here.
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
            {savedJobs.length === 1 ? "job" : "jobs"}
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
        {savedJobs.map((savedJob) => (
          <article
            key={
              savedJob.savedJobId ?? savedJob.jobId
            }
            className="jf-saved-card"
          >
            <div className="jf-saved-card-heading">
              <div className="jf-saved-company-icon">
                <BriefcaseBusiness size={23} />
              </div>

              <div>
                <p>{savedJob.company}</p>
                <h3>{savedJob.title}</h3>
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

            <div className="jf-saved-dates">
              <span>
                Posted:{" "}
                <strong>
                  {formatDate(savedJob.postedAt)}
                </strong>
              </span>

              <span>
                Saved:{" "}
                <strong>
                  {formatDate(savedJob.savedAt)}
                </strong>
              </span>
            </div>

            <div className="jf-saved-actions">
              <button
                type="button"
                className="jf-remove-button"
                disabled={
                  removingJobId === savedJob.jobId
                }
                onClick={() =>
                  handleRemove(savedJob.jobId)
                }
              >
                {removingJobId === savedJob.jobId ? (
                  <Loader2
                    className="jf-spin"
                    size={17}
                  />
                ) : (
                  <Trash2 size={17} />
                )}

                {removingJobId === savedJob.jobId
                  ? "Removing..."
                  : "Remove"}
              </button>

              {savedJob.applyUrl && (
                <a
                  className="jf-apply-button"
                  href={savedJob.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apply
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default SavedJobsPanel;