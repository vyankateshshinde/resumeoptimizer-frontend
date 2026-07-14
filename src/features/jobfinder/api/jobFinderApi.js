import axiosInstance from "../../../api/axiosInstance";

const BASE_PATH = "/api/job-finder";

export const searchJobs = async (payload) => {
  const response = await axiosInstance.post(`${BASE_PATH}/search`, payload);
  return response.data;
};

export const getJobDetails = async (jobId) => {
  const response = await axiosInstance.get(`${BASE_PATH}/jobs/${jobId}`);
  return response.data;
};

export const saveJob = async (jobId) => {
  const response = await axiosInstance.post(`${BASE_PATH}/saved-jobs/${jobId}`);
  return response.data;
};

export const getSavedJobs = async () => {
  const response = await axiosInstance.get(`${BASE_PATH}/saved-jobs`);
  return response.data;
};

export const removeSavedJob = async (jobId) => {
  await axiosInstance.delete(`${BASE_PATH}/saved-jobs/${jobId}`);
};

export const getPreferences = async () => {
  const response = await axiosInstance.get(`${BASE_PATH}/preferences`);
  return response.data;
};

export const createPreference = async (payload) => {
  const response = await axiosInstance.post(`${BASE_PATH}/preferences`, payload);
  return response.data;
};

export const updatePreference = async (preferenceId, payload) => {
  const response = await axiosInstance.put(
    `${BASE_PATH}/preferences/${preferenceId}`,
    payload
  );
  return response.data;
};

export const deletePreference = async (preferenceId) => {
  await axiosInstance.delete(`${BASE_PATH}/preferences/${preferenceId}`);
};

export const getAlerts = async () => {
  const response = await axiosInstance.get(`${BASE_PATH}/alerts`);
  return response.data;
};

export const createOrUpdateAlert = async (payload) => {
  const response = await axiosInstance.post(`${BASE_PATH}/alerts`, payload);
  return response.data;
};

export const setAlertEnabled = async (alertId, enabled) => {
  const response = await axiosInstance.patch(
    `${BASE_PATH}/alerts/${alertId}/enabled`,
    null,
    { params: { enabled } }
  );
  return response.data;
};

export const getNotifications = async () => {
  const response = await axiosInstance.get(`${BASE_PATH}/notifications`);
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await axiosInstance.patch(
    `${BASE_PATH}/notifications/${notificationId}/read`
  );
  return response.data;
};
