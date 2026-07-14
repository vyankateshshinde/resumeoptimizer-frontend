import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  BellOff,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import axiosInstance from "../../../api/axiosInstance";

import {
  createOrUpdateAlert,
  createPreference,
  deleteAlert,
  deletePreference,
  getAlerts,
  getPreferences,
  setAlertEnabled,
} from "../api/jobFinderApi";

const WORK_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
];

const splitValues = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  fallback;

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

const AlertsPanel = () => {
  const [resumes, setResumes] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [busyAlertId, setBusyAlertId] =
    useState(null);
  const [deletingPreferenceId, setDeletingPreferenceId] =
    useState(null);

  const [form, setForm] = useState({
    name: "Java Backend Jobs",
    resumeId: "",
    jobTitles:
      "Java Developer, Backend Developer",
    locations: "Pune, Bengaluru, Hyderabad",
    workArrangements: ["REMOTE", "HYBRID"],
    experienceYears: "",
    postedWithinDays: 7,
    minimumMatchPercentage: 60,
    enabled: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        resumesResponse,
        preferencesResponse,
        alertsResponse,
      ] = await Promise.all([
        axiosInstance.get("/api/resume/my-resumes"),
        getPreferences(),
        getAlerts(),
      ]);

      const resumeList = Array.isArray(
        resumesResponse.data
      )
        ? resumesResponse.data
        : [];

      const preferenceList = Array.isArray(
        preferencesResponse
      )
        ? preferencesResponse
        : [];

      const alertList = Array.isArray(alertsResponse)
        ? alertsResponse
        : [];

      setResumes(resumeList);
      setPreferences(preferenceList);
      setAlerts(alertList);

      if (resumeList.length > 0) {
        setForm((current) => ({
          ...current,
          resumeId:
            current.resumeId ||
            String(resumeList[0].id),
        }));
      }
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to load preferences and alerts"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFieldChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleWorkArrangement = (value) => {
    setForm((current) => ({
      ...current,
      workArrangements:
        current.workArrangements.includes(value)
          ? current.workArrangements.filter(
              (item) => item !== value
            )
          : [
              ...current.workArrangements,
              value,
            ],
    }));
  };

  const findAlertForPreference = (
    preferenceId
  ) =>
    alerts.find(
      (alert) =>
        Number(alert.preference?.id) ===
        Number(preferenceId)
    );

  const handleCreatePreference = async (
    event
  ) => {
    event.preventDefault();

    const jobTitles = splitValues(
      form.jobTitles
    ).slice(0, 5);

    if (!form.resumeId) {
      toast.error("Please select a resume");
      return;
    }

    if (!form.name.trim()) {
      toast.error(
        "Please enter a preference name"
      );
      return;
    }

    if (jobTitles.length === 0) {
      toast.error(
        "Please enter at least one job title"
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      resumeId: Number(form.resumeId),
      jobTitles,
      locations: splitValues(
        form.locations
      ).slice(0, 10),
      workArrangements:
        form.workArrangements,
      employmentTypes: ["FULL_TIME"],
      experienceYears:
        form.experienceYears === ""
          ? null
          : Number(form.experienceYears),
      postedWithinDays: Number(
        form.postedWithinDays
      ),
      minimumSalary: null,
      minimumMatchPercentage: Number(
        form.minimumMatchPercentage
      ),
      sortBy: "BEST_MATCH",
    };

    try {
      setSubmitting(true);

      const createdPreference =
        await createPreference(payload);

      setPreferences((current) => [
        ...current,
        createdPreference,
      ]);

      if (form.enabled) {
        const createdAlert =
          await createOrUpdateAlert({
            preferenceId:
              createdPreference.id,
            enabled: true,
          });

        setAlerts((current) => [
          ...current,
          createdAlert,
        ]);

        toast.success(
          "Preference and alert created"
        );
      } else {
        toast.success(
          "Search preference created"
        );
      }

      setForm((current) => ({
        ...current,
        name: "",
      }));
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to create preference"
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAlert = async (
    preferenceId
  ) => {
    try {
      setBusyAlertId(
        `preference-${preferenceId}`
      );

      const createdAlert =
        await createOrUpdateAlert({
          preferenceId,
          enabled: true,
        });

      setAlerts((current) => [
        ...current.filter(
          (alert) =>
            Number(alert.preference?.id) !==
            Number(preferenceId)
        ),
        createdAlert,
      ]);

      toast.success("Job alert enabled");
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to create alert"
        )
      );
    } finally {
      setBusyAlertId(null);
    }
  };

  const handleToggleAlert = async (
    alert
  ) => {
    try {
      setBusyAlertId(alert.id);

      const updatedAlert =
        await setAlertEnabled(
          alert.id,
          !alert.enabled
        );

      setAlerts((current) =>
        current.map((item) =>
          Number(item.id) ===
          Number(alert.id)
            ? updatedAlert
            : item
        )
      );

      toast.success(
        updatedAlert.enabled
          ? "Alert enabled"
          : "Alert disabled"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to update alert"
        )
      );
    } finally {
      setBusyAlertId(null);
    }
  };

  const handleDeletePreference = async (
    preference
  ) => {
    const confirmed = window.confirm(
      `Delete "${preference.name}" and its alert?`
    );

    if (!confirmed) {
      return;
    }

    const linkedAlert =
      findAlertForPreference(preference.id);

    try {
      setDeletingPreferenceId(
        preference.id
      );

      if (linkedAlert) {
        await deleteAlert(linkedAlert.id);

        setAlerts((current) =>
          current.filter(
            (alert) =>
              Number(alert.id) !==
              Number(linkedAlert.id)
          )
        );
      }

      await deletePreference(preference.id);

      setPreferences((current) =>
        current.filter(
          (item) =>
            Number(item.id) !==
            Number(preference.id)
        )
      );

      toast.success(
        "Preference deleted"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        getErrorMessage(
          error,
          "Unable to delete preference"
        )
      );
    } finally {
      setDeletingPreferenceId(null);
    }
  };

  if (loading) {
    return (
      <section className="jf-alert-loading">
        <Loader2
          className="jf-spin"
          size={30}
        />

        <p>
          Loading preferences and alerts...
        </p>
      </section>
    );
  }

  return (
    <section className="jf-alert-page">
      <form
        className="jf-alert-form"
        onSubmit={handleCreatePreference}
      >
        <div className="jf-alert-heading">
          <div>
            <h2>Create Job Alert</h2>

            <p>
              Save your search settings and receive
              notifications for matching jobs.
            </p>
          </div>

          <Bell size={28} />
        </div>

        {resumes.length === 0 ? (
          <div className="jf-alert-no-resume">
            <FileText size={24} />

            <div>
              <strong>
                No resume available
              </strong>

              <p>
                Upload a resume before creating an
                alert.
              </p>
            </div>
          </div>
        ) : (
          <div className="jf-alert-form-grid">
            <label>
              <span>Preference name</span>

              <input
                name="name"
                value={form.name}
                onChange={handleFieldChange}
                placeholder="Java Backend Jobs"
                required
              />
            </label>

            <label>
              <span>Resume</span>

              <select
                name="resumeId"
                value={form.resumeId}
                onChange={handleFieldChange}
                required
              >
                <option value="">
                  Select resume
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
            </label>

            <label className="jf-alert-wide">
              <span>
                Job titles, separated by commas
              </span>

              <input
                name="jobTitles"
                value={form.jobTitles}
                onChange={handleFieldChange}
                placeholder="Java Developer, Backend Developer"
                required
              />
            </label>

            <label className="jf-alert-wide">
              <span>
                Locations, separated by commas
              </span>

              <input
                name="locations"
                value={form.locations}
                onChange={handleFieldChange}
                placeholder="Pune, Bengaluru"
              />
            </label>

            <label>
              <span>Experience</span>

              <input
                name="experienceYears"
                type="number"
                min="0"
                max="60"
                step="0.5"
                value={form.experienceYears}
                onChange={handleFieldChange}
                placeholder="3"
              />
            </label>

            <label>
              <span>Posted within</span>

              <select
                name="postedWithinDays"
                value={form.postedWithinDays}
                onChange={handleFieldChange}
              >
                {[1, 2, 3, 5, 7, 14, 30].map(
                  (days) => (
                    <option
                      key={days}
                      value={days}
                    >
                      Last {days} day
                      {days > 1 ? "s" : ""}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>Minimum match</span>

              <select
                name="minimumMatchPercentage"
                value={
                  form.minimumMatchPercentage
                }
                onChange={handleFieldChange}
              >
                {[0, 40, 50, 60, 70, 80, 90].map(
                  (score) => (
                    <option
                      key={score}
                      value={score}
                    >
                      {score === 0
                        ? "Any match"
                        : `${score}% and above`}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="jf-alert-checkbox">
              <input
                name="enabled"
                type="checkbox"
                checked={form.enabled}
                onChange={handleFieldChange}
              />

              <span>
                Enable alert immediately
              </span>
            </label>
          </div>
        )}

        <div className="jf-alert-work">
          <span>Work mode</span>

          <div>
            {WORK_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  form.workArrangements.includes(
                    option.value
                  )
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  toggleWorkArrangement(
                    option.value
                  )
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="jf-create-alert-button"
          disabled={
            submitting ||
            resumes.length === 0
          }
        >
          {submitting ? (
            <Loader2
              className="jf-spin"
              size={18}
            />
          ) : (
            <Plus size={18} />
          )}

          {submitting
            ? "Creating..."
            : "Create Preference"}
        </button>
      </form>

      <div className="jf-preferences-section">
        <div className="jf-saved-heading">
          <div>
            <h2>Saved Preferences</h2>

            <p>
              {preferences.length} saved{" "}
              {preferences.length === 1
                ? "preference"
                : "preferences"}
            </p>
          </div>

          <button
            type="button"
            className="jf-refresh-button"
            onClick={loadData}
          >
            Refresh
          </button>
        </div>

        {preferences.length === 0 ? (
          <div className="jf-alert-empty">
            <BellOff size={40} />

            <h3>No preferences yet</h3>

            <p>
              Create your first job preference
              above.
            </p>
          </div>
        ) : (
          <div className="jf-preference-grid">
            {preferences.map((preference) => {
              const alert =
                findAlertForPreference(
                  preference.id
                );

              const isBusy =
                busyAlertId === alert?.id ||
                busyAlertId ===
                  `preference-${preference.id}`;

              return (
                <article
                  key={preference.id}
                  className="jf-preference-card"
                >
                  <div className="jf-preference-title">
                    <div>
                      <p>
                        Search Preference
                      </p>

                      <h3>
                        {preference.name}
                      </h3>
                    </div>

                    {alert ? (
                      <span
                        className={
                          alert.enabled
                            ? "jf-alert-status enabled"
                            : "jf-alert-status disabled"
                        }
                      >
                        {alert.enabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    ) : (
                      <span className="jf-alert-status none">
                        No alert
                      </span>
                    )}
                  </div>

                  <div className="jf-preference-details">
                    <div>
                      <span>Job titles</span>

                      <strong>
                        {preference.jobTitles?.join(
                          ", "
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Locations</span>

                      <strong>
                        {preference.locations
                          ?.length
                          ? preference.locations.join(
                              ", "
                            )
                          : "Any location"}
                      </strong>
                    </div>

                    <div>
                      <span>Work mode</span>

                      <strong>
                        {preference.workArrangements
                          ?.length
                          ? preference.workArrangements
                              .map(formatValue)
                              .join(", ")
                          : "Any"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Minimum match
                      </span>

                      <strong>
                        {preference.minimumMatchPercentage ??
                          0}
                        %
                      </strong>
                    </div>
                  </div>

                  <div className="jf-preference-actions">
                    {alert ? (
                      <button
                        type="button"
                        className="jf-toggle-alert-button"
                        disabled={isBusy}
                        onClick={() =>
                          handleToggleAlert(alert)
                        }
                      >
                        {isBusy ? (
                          <Loader2
                            className="jf-spin"
                            size={17}
                          />
                        ) : alert.enabled ? (
                          <BellOff size={17} />
                        ) : (
                          <Bell size={17} />
                        )}

                        {alert.enabled
                          ? "Disable Alert"
                          : "Enable Alert"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="jf-toggle-alert-button"
                        disabled={isBusy}
                        onClick={() =>
                          handleCreateAlert(
                            preference.id
                          )
                        }
                      >
                        {isBusy ? (
                          <Loader2
                            className="jf-spin"
                            size={17}
                          />
                        ) : (
                          <Bell size={17} />
                        )}

                        Enable Alert
                      </button>
                    )}

                    <button
                      type="button"
                      className="jf-delete-preference-button"
                      disabled={
                        deletingPreferenceId ===
                        preference.id
                      }
                      onClick={() =>
                        handleDeletePreference(
                          preference
                        )
                      }
                    >
                      {deletingPreferenceId ===
                      preference.id ? (
                        <Loader2
                          className="jf-spin"
                          size={17}
                        />
                      ) : (
                        <Trash2 size={17} />
                      )}

                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AlertsPanel;