// Environment configuration for the application
// For local development, you can use localhost with appropriate port
// For production, use your actual API server URL

// Default API URLs if environment variables are not set
const defaultDevApiUrl = "http://localhost:3000";
const defaultProdApiUrl = "https://makuta-ners-ung.com/api";

// Get API URLs from environment variables or use defaults
const devApiUrl = process.env.EXPO_PUBLIC_DEV_API_URL || defaultDevApiUrl;
const prodApiUrl = process.env.EXPO_PUBLIC_API_URL || defaultProdApiUrl;

// Set API URL based on environment
// export const API_URL = prodApiUrl; // Use the production URL by default
export const API_URL = process.env.EXPO_PUBLIC_API_URL;
export const API_FILE_URL = process.env.EXPO_PUBLIC_API_FILE_URL;
// API Endpoints
export const ENDPOINTS = {
  LOGIN: "/auth/login",
  SESSION: "/auth/session",
  LOGOUT: "/auth/logout",
  STASES: "/staces",
  GROUPS: "/groups",
  REGISTER: "/auth/register",
  STUDENTS_REGISTER: "/students/register",
  ADVISORS_REGISTER: "/advisors/register",
  ACTIVITIES: "/activities",
  ADVISORS_CLINICS: "/advisors/clinics",
  UPDATE_STUDENT_PROFILE: "/students/profile",
  UPDATE_ADVISOR_PROFILE: "/advisors/profile",
  VISITS: "/visits",
  LOGBOOKS: "/logbooks",
  ADDITIONAL_ACTIVITIES: "/additional-activities",
  ATTENDANCES: "/attendances",
  REGISTER_DEVICE: "/register-device",
  NOTIFICATIONS: "/notifications",
};

// Timeouts
export const API_TIMEOUT = 15000; // 15 seconds

// Firebase Configuration for Android and iOS only
// Web configuration removed as it's not needed

// FCM Configuration
export const FCM_CONFIG = {
  androidChannelId: "default-channel",
  androidChannelName: "Default Channel",
  androidChannelDescription: "Default notification channel"
};
