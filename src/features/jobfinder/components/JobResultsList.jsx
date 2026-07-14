import { SearchX } from "lucide-react";
import JobResultCard from "./JobResultCard";

const JobResultsList = ({ result, savingJobId, onSave }) => {
  const jobs = result?.jobs || [];

  if (!result) {
    return (
      <div className="jf-empty">
        <SearchX size={38} />
        <h3>Start with your preferences</h3>
        <p>Your matching jobs will appear here.</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="jf-empty">
        <SearchX size={38} />
        <h3>No matching jobs found</h3>
        <p>Try broader titles, locations, or a lower match threshold.</p>
      </div>
    );
  }

  return (
    <section>
      <div className="jf-results-summary">
        <div>
          <h2>Recommended jobs</h2>
          <p>{result.totalElements} matching job{result.totalElements === 1 ? "" : "s"}</p>
        </div>
        <span>Page {result.page + 1} of {Math.max(result.totalPages, 1)}</span>
      </div>

      <div className="jf-results-list">
        {jobs.map((job) => (
          <JobResultCard
            key={job.jobId}
            job={job}
            saving={savingJobId === job.jobId}
            onSave={onSave}
          />
        ))}
      </div>
    </section>
  );
};

export default JobResultsList;
