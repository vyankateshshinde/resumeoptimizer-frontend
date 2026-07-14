import { useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  BookmarkCheck,
  BriefcaseBusiness,
  Search,
  Target,
} from "lucide-react";

import JobFinderSearchForm from "./components/JobFinderSearchForm";
import JobResultsList from "./components/JobResultsList";
import SavedJobsPanel from "./components/SavedJobsPanel";

import {
  saveJob,
  searchJobs,
} from "./api/jobFinderApi";

import "./jobFinder.css";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

const JobFinderPage = () => {
  const [activeTab, setActiveTab] =
    useState("search");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingJobId, setSavingJobId] =
    useState(null);
  const [savedJobsVersion, setSavedJobsVersion] =
    useState(0);

  const handleSearch = async (payload) => {
    if (
      !payload.resumeId ||
      payload.jobTitles.length === 0
    ) {
      toast.error(
        "Please select a resume and enter at least one job title"
      );
      return;
    }

    try {
      setLoading(true);

      const data = await searchJobs(payload);

      setResult(data);

      toast.success(
        `Found ${data.totalElements} matching jobs`
      );
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to search jobs"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (jobId) => {
    try {
      setSavingJobId(jobId);

      await saveJob(jobId);

      setSavedJobsVersion(
        (current) => current + 1
      );

      toast.success("Job saved");
    } catch (error) {
      console.error(error);

      const status = error?.response?.status;

      if (status === 409) {
        toast.error("This job is already saved");
        return;
      }

      toast.error(
        getErrorMessage(error, "Unable to save job")
      );
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="jf-page">
      <header className="jf-hero">
        <div>
          <p>
            <Target size={17} />
            AI Job Finder
          </p>

          <h1>
            Find jobs matched to your resume
          </h1>

          <span>
            Search recent openings, compare skills,
            and rank opportunities by resume fit,
            title relevance, experience, and
            freshness.
          </span>
        </div>

        <div className="jf-hero-stats">
          <div>
            <BriefcaseBusiness size={22} />
            <strong>Recent roles</strong>
            <span>1–30 day filters</span>
          </div>

          <div>
            <Target size={22} />
            <strong>Match scoring</strong>
            <span>Resume + job signals</span>
          </div>

          <div>
            <Bell size={22} />
            <strong>Alerts ready</strong>
            <span>
              Preferences and notifications
            </span>
          </div>
        </div>
      </header>

      <div className="jf-tabs">
        <button
          type="button"
          className={
            activeTab === "search"
              ? "jf-tab-button active"
              : "jf-tab-button"
          }
          onClick={() => setActiveTab("search")}
        >
          <Search size={18} />
          Search Jobs
        </button>

        <button
          type="button"
          className={
            activeTab === "saved"
              ? "jf-tab-button active"
              : "jf-tab-button"
          }
          onClick={() => setActiveTab("saved")}
        >
          <BookmarkCheck size={18} />
          Saved Jobs
        </button>
      </div>

      {activeTab === "search" ? (
        <div className="jf-layout">
          <JobFinderSearchForm
            loading={loading}
            onSearch={handleSearch}
          />

          <JobResultsList
            result={result}
            savingJobId={savingJobId}
            onSave={handleSave}
          />
        </div>
      ) : (
        <SavedJobsPanel
          refreshKey={savedJobsVersion}
        />
      )}
    </div>
  );
};

export default JobFinderPage;