import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Eye,
  HelpCircle,
  MapPin,
  Save,
  Sparkles,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(parsedDate);
};

const formatSalaryValue = (
  value
) => {
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
    job.minimumSalary == null &&
    job.maximumSalary == null
  ) {
    return "Salary not disclosed";
  }

  const currency =
    job.salaryCurrency || "";

  const minimum =
    job.minimumSalary != null
      ? formatSalaryValue(
          job.minimumSalary
        )
      : null;

  const maximum =
    job.maximumSalary != null
      ? formatSalaryValue(
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

const normalizeRequirementType = (
  value
) =>
  String(
    value || "NOT_SPECIFIED"
  )
    .trim()
    .toUpperCase();

const getExperiencePresentation = (
  job
) => {
  const type =
    normalizeRequirementType(
      job.experienceRequirementType
    );

  switch (type) {
    case "REQUIRED":
      return {
        className: "required",
        label:
          "Required experience",
        message:
          "This is a mandatory eligibility requirement.",
        Icon: CheckCircle2,
      };

    case "PREFERRED":
      return {
        className: "preferred",
        label:
          "Preferred experience",
        message:
          "You can still apply when your experience is below this preference.",
        Icon: Sparkles,
      };

    case "AMBIGUOUS":
      return {
        className: "ambiguous",
        label:
          "Verify experience",
        message:
          "The job description contains an unclear or conflicting experience requirement.",
        Icon: AlertTriangle,
      };

    default:
      return {
        className: "unspecified",
        label:
          "Experience not specified",
        message:
          "No reliable experience requirement was found in the job description.",
        Icon: HelpCircle,
      };
  }
};

const ExperienceRequirement = ({
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

  const extractionMethod =
    job.experienceExtractionMethod &&
    job.experienceExtractionMethod !==
      "NOT_PROCESSED"
      ? job.experienceExtractionMethod
      : null;

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

      {(confidence ||
        extractionMethod) && (
        <div className="jf-experience-metadata">
          {confidence && (
            <span>{confidence}</span>
          )}

          {extractionMethod && (
            <span>
              Extracted by{" "}
              {extractionMethod
                .replace(/_/g, " ")
                .toLowerCase()}
            </span>
          )}
        </div>
      )}
    </section>
  );
};

const JobResultCard = ({
  job,
  saving,
  onSave,
  onViewDetails,
}) => {
  const canApply =
    Boolean(job.applyUrl);

  return (
    <article className="jf-result-card">
      <div className="jf-result-heading">
        <div>
          <p className="jf-company">
            <Building2 size={16} />

            {job.company ||
              "Company unavailable"}
          </p>

          <h3>
            {job.title ||
              "Job title unavailable"}
          </h3>
        </div>

        <div className="jf-score">
          <strong>
            {job.matchPercentage ?? 0}%
          </strong>

          <span>match</span>
        </div>
      </div>

      <div className="jf-meta">
        <span>
          <MapPin size={15} />

          {job.location ||
            "Location unavailable"}
        </span>

        <span>
          <BriefcaseBusiness
            size={15}
          />

          {job.workArrangement ||
            "UNSPECIFIED"}
        </span>

        <span>
          <CalendarDays size={15} />

          {formatDate(job.postedAt)}
        </span>
      </div>

      <ExperienceRequirement
        job={job}
      />

      <p className="jf-description">
        {job.descriptionPreview ||
          "No description preview available."}
      </p>

      <div className="jf-score-grid">
        <span>
          Resume

          <strong>
            {job.resumeMatchPercentage ??
              0}
            %
          </strong>
        </span>

        <span>
          Title

          <strong>
            {job.titleMatchPercentage ??
              0}
            %
          </strong>
        </span>

        <span>
          Experience

          <strong>
            {job.experienceMatchPercentage ??
              0}
            %
          </strong>
        </span>

        <span>
          Freshness

          <strong>
            {job.freshnessPercentage ??
              0}
            %
          </strong>
        </span>
      </div>

      {(job.matchedSkills?.length >
        0 ||
        job.missingSkills?.length >
          0) && (
        <div className="jf-skills">
          {job.matchedSkills
            ?.slice(0, 6)
            .map((skill) => (
              <span
                className="matched"
                key={`matched-${skill}`}
              >
                {skill}
              </span>
            ))}

          {job.missingSkills
            ?.slice(0, 4)
            .map((skill) => (
              <span
                className="missing"
                key={`missing-${skill}`}
              >
                Missing: {skill}
              </span>
            ))}
        </div>
      )}

      {job.matchExplanation && (
        <p className="jf-explanation">
          <Sparkles size={16} />

          {job.matchExplanation}
        </p>
      )}

      <div className="jf-card-footer">
        <span>
          {formatSalary(job)}
        </span>

        <div>
          <button
            type="button"
            className="jf-view-details-button"
            onClick={() =>
              onViewDetails?.(
                job.jobId
              )
            }
          >
            <Eye size={16} />
            Details
          </button>

          <button
            type="button"
            onClick={() =>
              onSave?.(job.jobId)
            }
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? "Saving..."
              : "Save"}
          </button>

          {canApply && (
            <a
              href={job.applyUrl}
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
      </div>
    </article>
  );
};

export default JobResultCard;