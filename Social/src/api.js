export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export const IMGBB_API_KEY =
  import.meta.env.VITE_IMGBB_API_KEY || "98257fe3ec3403ba357fa7640e88fb49";

export const buildApiUrl = (pathname = "") => {
  if (!pathname) {
    return API_BASE_URL;
  }

  return pathname.startsWith("http")
    ? pathname
    : `${API_BASE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
};

export const resolveMediaUrl = (value = "") =>
  value.startsWith("http") ? value : buildApiUrl(value);
