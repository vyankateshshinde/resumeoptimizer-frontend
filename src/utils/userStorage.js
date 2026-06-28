const APP_CACHE_PREFIX = "resume-optimizer";

const LEGACY_SHARED_KEYS = [
  "selectedResume",
  "atsAnalysisPageState",
  "latestAtsResult",
  "latestRuleAtsResult",
  "latestAiAtsResult",
  "latestJobDescription",
  "latestGeneratedResume",
  "resumeBuilderJobDescription",
  "resumeBuilderTemplateName",
  "generatedResume",
  "resumeBuilderResult",
  "latestAiRecommendation",
  "latestAiRecommendationResult",
];

const decodeJwtPayload = (token) => {
  try {
    const payload = token?.split(".")?.[1];

    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map(
          (character) =>
            `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`
        )
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getCurrentUserEmail = () => {
  const payload = decodeJwtPayload(localStorage.getItem("token"));

  return String(
    payload?.sub || payload?.email || payload?.userEmail || payload?.username || ""
  )
    .trim()
    .toLowerCase();
};

export const getUserStorageKey = (key) => {
  const email = getCurrentUserEmail();
  const safeEmail = encodeURIComponent(email || "anonymous");

  return `${APP_CACHE_PREFIX}:${safeEmail}:${key}`;
};

export const getUserStorageItem = (key) => {
  return localStorage.getItem(getUserStorageKey(key));
};

export const setUserStorageItem = (key, value) => {
  localStorage.setItem(getUserStorageKey(key), value);
};

export const removeUserStorageItem = (key) => {
  localStorage.removeItem(getUserStorageKey(key));
};

export const purgeLegacySharedWorkspaceCache = () => {
  LEGACY_SHARED_KEYS.forEach((key) => localStorage.removeItem(key));
};
