import {
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Database,
  ExternalLink,
  HelpCircle,
  Loader2,
  MapPin,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import {
  getJobDetails,
} from "../api/jobFinderApi";

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

const formatValue = (value) => {
  if (!value) {
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

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(1);
};

const formatExperience = (job) => {
  const minimum = formatNumber(
    job?.minimumExperience
  );

  const maximum = formatNumber(
    job?.maximumExperience
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

const formatSalaryNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  ).format(number);
};

const formatSalary = (job) => {
  if (
    job?.minimumSalary == null &&
    job?.maximumSalary == null
  ) {
    return "Salary not disclosed";
  }

  const currency =
    job.salaryCurrency || "";

  const minimum =
    job.minimumSalary != null
      ? formatSalaryNumber(
          job.minimumSalary
        )
      : null;

  const maximum =
    job.maximumSalary != null
      ? formatSalaryNumber(
          job.maximumSalary
        )
      : null;

  if (minimum && maximum) {
    return `${currency} ${minimum} - ${maximum}`.trim();
  }

  if (minimum) {
    return `${currency} ${minimum}+`.trim();
  }

  return `Up to ${currency} ${maximum}`.trim();
};

const formatConfidence = (value) => {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return "Not available";
  }

  return `${Math.round(
    Math.min(
      Math.max(confidence, 0),
      1
    ) * 100
  )}%`;
};

const getRequirementPresentation = (
  typeValue
) => {
  const type = String(
    typeValue || "NOT_SPECIFIED"
  )
    .trim()
    .toUpperCase();

  switch (type) {
    case "REQUIRED":
      return {
        className: "required",
        title: "Required experience",
        message:
          "This experience level is treated as a mandatory eligibility condition.",
        Icon: BadgeCheck,
      };

    case "PREFERRED":
      return {
        className: "preferred",
        title: "Preferred experience",
        message:
          "The employer prefers this experience level, but candidates below it may still be considered.",
        Icon: Sparkles,
      };

    case "AMBIGUOUS":
      return {
        className: "ambiguous",
        title: "Experience needs verification",
        message:
          "The job description contains unclear or conflicting experience information.",
        Icon: AlertTriangle,
      };

    default:
      return {
        className: "unspecified",
        title: "Experience not specified",
        message:
          "No reliable experience requirement could be extracted.",
        Icon: HelpCircle,
      };
  }
};

const JobDetailsModal = ({
  jobId,
  onClose,
}) => {
  const [job, setJob] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let mounted = true;

    const loadJob = async () => {
      try {
        setLoading(true);
        setError("");
        setJob(null);

        const data =
          await getJobDetails(jobId);

        if (mounted) {
          setJob(data);
        }
      } catch (requestError) {
        console.error(
          "Unable to load job details",
          requestError
        );

        if (mounted) {
          setError(
            requestError?.response?.data
              ?.message ||
              requestError?.response?.data
                ?.error ||
              "Unable to load job details"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadJob();

    return () => {
      mounted = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [jobId, onClose]);

  if (
    !jobId ||
    typeof document === "undefined"
  ) {
    return null;
  }

  const requirement =
    getRequirementPresentation(
      job?.experienceRequirementType
    );

  const RequirementIcon =
    requirement.Icon;

  return createPortal(
    <div
      className="jf-details-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="jf-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="jf-details-title"
      >
        <button
          type="button"
          className="jf-details-close"
          aria-label="Close job details"
          onClick={onClose}
        >
          <X size={21} />
        </button>

        {loading && (
          <div className="jf-details-state">
            <Loader2
              className="jf-spin"
              size={34}
            />

            <p>Loading job details...</p>
          </div>
        )}

        {!loading && error && (
          <div className="jf-details-state error">
            <AlertTriangle size={34} />

            <h3>
              Could not load this job
            </h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}

        {!loading && job && (
          <>
            <header className="jf-details-header">
              <p>
                <Building2 size={17} />
                {job.company ||
                  "Company unavailable"}
              </p>

              <h2 id="jf-details-title">
                {job.title ||
                  "Job details"}
              </h2>

              <div className="jf-details-meta">
                <span>
                  <MapPin size={16} />
                  {job.location ||
                    "Location unavailable"}
                </span>

                <span>
                  <BriefcaseBusiness
                    size={16}
                  />
                  {formatValue(
                    job.workArrangement
                  )}
                </span>

                <span>
                  <CalendarDays size={16} />
                  Posted{" "}
                  {formatDate(
                    job.postedAt
                  )}
                </span>
              </div>
            </header>

            <div className="jf-details-summary-grid">
              <div>
                <BriefcaseBusiness
                  size={20}
                />

                <span>Employment</span>

                <strong>
                  {formatValue(
                    job.employmentType
                  )}
                </strong>
              </div>

              <div>
                <Wallet size={20} />

                <span>Salary</span>

                <strong>
                  {formatSalary(job)}
                </strong>
              </div>

              <div>
                <Database size={20} />

                <span>Source</span>

                <strong>
                  {job.sourceName ||
                    formatValue(
                      job.source
                    )}
                </strong>
              </div>
            </div>

            <section
              className={`jf-details-experience ${requirement.className}`}
            >
              <div className="jf-details-experience-heading">
                <RequirementIcon
                  size={22}
                />

                <div>
                  <span>
                    {requirement.title}
                  </span>

                  <strong>
                    {formatExperience(job)}
                  </strong>
                </div>
              </div>

              <p>
                {requirement.message}
              </p>

              {job.experienceEvidence && (
                <blockquote>
                  “
                  {
                    job.experienceEvidence
                  }
                  ”
                </blockquote>
              )}

              <div className="jf-details-experience-data">
                <span>
                  Confidence:{" "}
                  <strong>
                    {formatConfidence(
                      job.experienceConfidence
                    )}
                  </strong>
                </span>

                <span>
                  Method:{" "}
                  <strong>
                    {formatValue(
                      job.experienceExtractionMethod
                    )}
                  </strong>
                </span>
              </div>
            </section>

            <section className="jf-details-description">
              <h3>Full job description</h3>

              <p>
                {job.description ||
                  "No job description is available."}
              </p>
            </section>

            <footer className="jf-details-footer">
              <div>
                <span>
                  Fetched{" "}
                  {formatDate(
                    job.fetchedAt
                  )}
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={onClose}
                >
                  Close
                </button>

                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apply now
                    <ExternalLink
                      size={17}
                    />
                  </a>
                )}
              </div>
            </footer>
          </>
        )}
      </section>
    </div>,
    document.body
  );
};

export default JobDetailsModal;