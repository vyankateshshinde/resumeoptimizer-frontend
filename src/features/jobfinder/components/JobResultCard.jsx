import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ExternalLink,
  MapPin,
  Save,
  Sparkles,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatSalary = (job) => {
  if (!job.minimumSalary && !job.maximumSalary) return "Salary not disclosed";
  const currency = job.salaryCurrency || "";
  const minimum = job.minimumSalary ?? "";
  const maximum = job.maximumSalary ?? "";
  return `${currency} ${minimum}${maximum ? ` - ${maximum}` : ""}`.trim();
};

const JobResultCard = ({ job, saving, onSave }) => (
  <article className="jf-result-card">
    <div className="jf-result-heading">
      <div>
        <p className="jf-company">
          <Building2 size={16} /> {job.company}
        </p>
        <h3>{job.title}</h3>
      </div>
      <div className="jf-score">
        <strong>{job.matchPercentage}%</strong>
        <span>match</span>
      </div>
    </div>

    <div className="jf-meta">
      <span><MapPin size={15} /> {job.location || "Location unavailable"}</span>
      <span><BriefcaseBusiness size={15} /> {job.workArrangement || "UNSPECIFIED"}</span>
      <span><CalendarDays size={15} /> {formatDate(job.postedAt)}</span>
    </div>

    <p className="jf-description">
      {job.descriptionPreview || "No description preview available."}
    </p>

    <div className="jf-score-grid">
      <span>Resume <strong>{job.resumeMatchPercentage}%</strong></span>
      <span>Title <strong>{job.titleMatchPercentage}%</strong></span>
      <span>Experience <strong>{job.experienceMatchPercentage}%</strong></span>
      <span>Freshness <strong>{job.freshnessPercentage}%</strong></span>
    </div>

    {(job.matchedSkills?.length > 0 || job.missingSkills?.length > 0) && (
      <div className="jf-skills">
        {job.matchedSkills?.slice(0, 6).map((skill) => (
          <span className="matched" key={`matched-${skill}`}>{skill}</span>
        ))}
        {job.missingSkills?.slice(0, 4).map((skill) => (
          <span className="missing" key={`missing-${skill}`}>Missing: {skill}</span>
        ))}
      </div>
    )}

    <p className="jf-explanation">
      <Sparkles size={16} /> {job.matchExplanation}
    </p>

    <div className="jf-card-footer">
      <span>{formatSalary(job)}</span>
      <div>
        <button type="button" onClick={() => onSave(job.jobId)} disabled={saving}>
          <Save size={16} /> {saving ? "Saving..." : "Save"}
        </button>
        <a href={job.applyUrl} target="_blank" rel="noreferrer">
          Apply <ExternalLink size={16} />
        </a>
      </div>
    </div>
  </article>
);

export default JobResultCard;
