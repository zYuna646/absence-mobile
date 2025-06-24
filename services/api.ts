import { API_URL, API_TIMEOUT, ENDPOINTS } from "@/constants/Config";
import { UserRole } from "@/context/UserContext";

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Login response data structure
export interface LoginResponseData {
  token: string;
}

// User session data structure
export interface UserSessionData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  type?: string;
  [key: string]: any; // Allow additional properties
}

// Stase data structure
export interface StaseData {
  id: number;
  name: string;
}

// Group data structure
export interface GroupData {
  id: number;
  name: string;
}

// Registration data structure
export interface RegistrationData {
  name: string;
  username: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  student_id: string;
  group_id: number;
  password: string;
}

// Advisor registration data structure
export interface AdvisorRegistrationData {
  name: string;
  username: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  stase_id: number;
  type: string; // "academic" or "clinic"
  // Fields for academic preceptor
  npwp?: string;
  nip?: string;
  // Fields for clinic preceptor
  location?: string;
  room?: string;
  password: string;
}

// File data structure
export interface FileData {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  file: string;
}

// Activity data structure
export interface ActivityData {
  id: number;
  name: string;
  indicators: string;
  clinic_advisor_id?: number;
  advisor_clinic_name?: string;
  created_at?: string;
  updated_at?: string;
}

// Clinic Advisor data structure
export interface ClinicAdvisorData {
  id: number;
  name: string;
  location?: string;
  room?: string;
  advisor_id?: number; // Added for API response structure
  // Add other relevant fields if needed
}

// Student profile update data structure
export interface StudentProfileUpdateData {
  name: string;
  username: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  student_id: string;
}

// Advisor profile update data structure
export interface AdvisorProfileUpdateData {
  name: string;
  username: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  stase_id: number;
  type: string; // "academic" or "clinic"
  // Fields for academic preceptor
  npwp?: string;
  nip?: string;
  // Fields for clinic preceptor
  location?: string;
  room?: string;
  password?: string; // Optional for updates
}

// Visit data structure
export interface VisitData {
  id: number;
  visit_date: string;
  visit_time: string;
  status: string;
  location: string;
  description?: string;
  photo?: string;
  score?: number;
}

// Attendance data structure
export interface AttendanceData {
  advisor: {
    id: string;
    name: string;
  };
  activity: {
    id: string;
    name: string;
  };
  check_in: {
    id: string;
    address: string;
    latitude: string;
    longitude: string;
    photo: string;
    check_time: string;
    date: string;
  };
  check_out: string | null;
}

export interface AttendanceListItem {
  check_in_id: number;
  check_in_date: string;
  check_in_time: string;
  check_out_date: string | null;
  check_out_time: string | null;
  status: "complete" | "incomplete";
}

export interface AttendanceDetail {
  advisor: {
    id: number;
    name: string;
  };
  activity: {
    id: number;
    name: string;
  };
  check_in: {
    id: number;
    address: string;
    latitude: string;
    longitude: string;
    photo: string;
    check_time: string;
    date: string;
  };
  check_out: {
    id: number;
    address: string;
    latitude: string;
    longitude: string;
    photo: string;
    description: string | null;
    check_time: string;
  } | null;
}

// Error handling for fetch
class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Helper function to build request options
const createRequestOptions = (
  method: string,
  body?: object,
  token?: string
): RequestInit => {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  // Add auth token if provided
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // Add body if provided (for POST, PUT, etc.)
  if (body) {
    options.body = JSON.stringify(body);
  }

  return options;
};

// Generic fetch with timeout and error handling
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit,
  isSilent: boolean = false
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    // Log the request data
    if (!isSilent) {
      console.log(
        "API Request:",
        url,
        options.body ? JSON.parse(options.body as string) : "No body"
      );
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    console.log("API Response Status:", response.status, response.statusText);

    // Get response text first
    const responseText = await response.text();
    console.log("API Response Text:", responseText);

    clearTimeout(timeoutId);

    // Try to parse the response as JSON, but handle parsing errors gracefully
    let data: any;
    try {
      data = responseText
        ? JSON.parse(responseText)
        : { success: false, message: "Empty response" };
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return {
        success: false,
        message: `Invalid response format: ${responseText.substring(
          0,
          100
        )}...`,
      };
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || "An error occurred during the API request",
        response.status
      );
    }

    return data as ApiResponse<T>;
  } catch (error) {
    // Only log errors for non-silent calls
    if (!isSilent && error instanceof Error && error.name !== "AbortError") {
      console.error("API error:", error);
    }

    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
      };
    }

    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        message: "Request timeout",
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// API functions
export const api = {
  // Authentication
  login: async (
    username: string,
    password: string
  ): Promise<ApiResponse<LoginResponseData>> => {
    const url = `${API_URL}${ENDPOINTS.LOGIN}`;
    console.log(url);
    const options = createRequestOptions("POST", { username, password });
    return fetchWithTimeout<LoginResponseData>(url, options);
  },

  // Get user session (profile)
  getSession: async (
    token: string,
    isSilent: boolean = false
  ): Promise<ApiResponse<UserSessionData>> => {
    const url = `${API_URL}${ENDPOINTS.SESSION}`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<UserSessionData>(url, options, isSilent);
  },

  // Logout (invalidate token)
  logout: async (token: string): Promise<ApiResponse<null>> => {
    const url = `${API_URL}${ENDPOINTS.LOGOUT}`;
    const options = createRequestOptions("POST", undefined, token);
    return fetchWithTimeout<null>(url, options);
  },

  // Logbook check-in
  checkInLogbook: async (
    token: string,
    formData: FormData
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}/logbooks/check-in`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data;
      try {
        data = responseText
          ? JSON.parse(responseText)
          : { success: false, message: "Empty response" };
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        return {
          success: false,
          message: `Invalid response format: ${responseText.substring(
            0,
            100
          )}...`,
        };
      }

      if (!response.ok) {
        throw new ApiError(
          data.message || "An error occurred during the logbook check-in",
          response.status
        );
      }

      return data;
    } catch (error) {
      console.error("API error:", error);

      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timeout",
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Get student logbooks
  getStudentLogbooks: async (
    token: string,
    activityId: number
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}/students/my-logbooks/${activityId}`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<any>(url, options);
  },

  // Get logbook details
  getLogbookDetails: async (
    token: string,
    checkInId: number
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}/logbooks/${checkInId}`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<any>(url, options);
  },

  // Get student dashboard statistics
  getStudentStatistics: async (token: string): Promise<ApiResponse<any>> => {
    const url = `${API_URL}/students/statistics`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<any>(url, options);
  },

  // Get advisor dashboard statistics
  getAdvisorStatistics: async (
    token: string,
    params?: {
      start_date?: string;
      end_date?: string;
      page?: number;
      per_page?: number;
      student_id?: number;
    }
  ): Promise<ApiResponse<any>> => {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.start_date)
        queryParams.append("start_date", params.start_date);
      if (params.end_date) queryParams.append("end_date", params.end_date);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.per_page)
        queryParams.append("per_page", params.per_page.toString());
      if (params.student_id)
        queryParams.append("student_id", params.student_id.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_URL}/advisors/statistics${
      queryString ? `?${queryString}` : ""
    }`;

    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<any>(url, options);
  },

  // Logbook check-out
  checkOutLogbook: async (
    token: string,
    checkInId: number,
    formData: FormData
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}/logbooks/${checkInId}/check-out`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data;
      try {
        data = responseText
          ? JSON.parse(responseText)
          : { success: false, message: "Empty response" };
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        return {
          success: false,
          message: `Invalid response format: ${responseText.substring(
            0,
            100
          )}...`,
        };
      }

      if (!response.ok) {
        throw new ApiError(
          data.message || "An error occurred during the logbook check-out",
          response.status
        );
      }

      return data;
    } catch (error) {
      console.error("API error:", error);

      if (error instanceof ApiError) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          message: "Request timeout",
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Get all stases
  getStases: async (token?: string): Promise<ApiResponse<StaseData[]>> => {
    const url = `${API_URL}${ENDPOINTS.STASES}`;
    console.log(url);

    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<StaseData[]>(url, options);
  },

  // Get all groups
  getGroups: async (token?: string): Promise<ApiResponse<GroupData[]>> => {
    const url = `${API_URL}${ENDPOINTS.GROUPS}`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<GroupData[]>(url, options);
  },

  // Register a new student
  registerStudent: async (
    data: RegistrationData
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}${ENDPOINTS.STUDENTS_REGISTER}`;

    // Ensure all data is properly formatted
    const sanitizedData = {
      name: data.name.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      birthday: data.birthday.trim(),
      gender: data.gender.trim(),
      student_id: data.student_id.trim(),
      group_id: Number(data.group_id),
      password: data.password,
    };

    const options = createRequestOptions("POST", sanitizedData);
    return fetchWithTimeout<any>(url, options);
  },

  // Register a new advisor
  registerAdvisor: async (
    data: AdvisorRegistrationData
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}${ENDPOINTS.ADVISORS_REGISTER}`;

    // Ensure all data is properly formatted
    const sanitizedData: any = {
      name: data.name.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      birthday: data.birthday.trim(),
      gender: data.gender.trim(),
      stace_id: Number(data.stase_id),
      type: data.type,
      password: data.password,
    };

    // Add specific fields based on preceptor type
    if (data.type === "academic") {
      sanitizedData.npwp = data.npwp?.trim() || "";
      sanitizedData.nip = data.nip?.trim() || "";
    } else if (data.type === "clinic") {
      sanitizedData.location = data.location?.trim() || "";
      sanitizedData.room = data.room?.trim() || "";
    }

    const options = createRequestOptions("POST", sanitizedData);
    return fetchWithTimeout<any>(url, options);
  },

  // Get all guide files
  getFiles: async (token?: string): Promise<ApiResponse<FileData[]>> => {
    const url = `${API_URL}/files`;
    const options = createRequestOptions("POST", undefined, token);
    return fetchWithTimeout<FileData[]>(url, options);
  },

  // Get file download URL
  getFileDownloadUrl: (fileId: number): string => {
    return `${API_URL}/files/downloads/${fileId}`;
  },

  // Get all activities
  getActivities: async (
    token: string
  ): Promise<ApiResponse<ActivityData[]>> => {
    const url = `${API_URL}${ENDPOINTS.ACTIVITIES}`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<ActivityData[]>(url, options);
  },

  // Create a new activity
  createActivity: async (
    token: string,
    data: {
      name: string;
      indicators: string;
      clinic_advisor_id: number;
    }
  ): Promise<ApiResponse<ActivityData>> => {
    const url = `${API_URL}${ENDPOINTS.ACTIVITIES}`;
    const options = createRequestOptions("POST", data, token);
    return fetchWithTimeout<ActivityData>(url, options);
  },

  // Get all clinic advisors
  getClinicAdvisors: async (
    token: string
  ): Promise<ApiResponse<ClinicAdvisorData[]>> => {
    const url = `${API_URL}${ENDPOINTS.ADVISORS_CLINICS}`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<ClinicAdvisorData[]>(url, options);
  },

  // Get all students
  getStudents: async (
    token: string,
    params?: {
      per_page?: number;
      search?: string;
    }
  ): Promise<ApiResponse<any>> => {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.per_page)
        queryParams.append("per_page", params.per_page.toString());
      if (params.search) queryParams.append("search", params.search);
    }

    const queryString = queryParams.toString();
    const url = `${API_URL}/students${queryString ? `?${queryString}` : ""}`;

    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<any>(url, options);
  },

  // Update student profile
  updateStudentProfile: async (
    token: string,
    data: StudentProfileUpdateData
  ): Promise<ApiResponse<UserSessionData>> => {
    const url = `${API_URL}${ENDPOINTS.UPDATE_STUDENT_PROFILE}`;
    const options = createRequestOptions("PUT", data, token);
    return fetchWithTimeout<UserSessionData>(url, options);
  },

  // Update advisor profile
  updateAdvisorProfile: async (
    token: string,
    data: AdvisorProfileUpdateData
  ): Promise<ApiResponse<UserSessionData>> => {
    const url = `${API_URL}${ENDPOINTS.UPDATE_ADVISOR_PROFILE}`;
    const options = createRequestOptions("PUT", data, token);
    return fetchWithTimeout<UserSessionData>(url, options);
  },

  // Visit API calls
  async checkInVisit(
    token: string,
    activityId: number,
    studentId: number,
    formData: FormData
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}${ENDPOINTS.VISITS}/${activityId}/${studentId}/check-in`;

      const options: RequestInit = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };

      const response = await fetch(url, options);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error in checkInVisit:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async checkOutVisit(
    token: string,
    checkInId: number,
    formData: FormData
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}${ENDPOINTS.VISITS}/${checkInId}/check-out`;

      const options: RequestInit = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };

      const response = await fetch(url, options);
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error in checkOutVisit:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getVisits(
    token: string,
    studentId: number
  ): Promise<ApiResponse<VisitData[]>> {
    try {
      const url = `${API_URL}${ENDPOINTS.VISITS}/student/${studentId}`;
      const options = createRequestOptions("GET", undefined, token);
      return fetchWithTimeout<VisitData[]>(url, options);
    } catch (error) {
      console.error("Error in getVisits:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getVisitsByActivity(
    token: string,
    activityId: number,
    studentId: number
  ): Promise<
    ApiResponse<{
      activity: { id: string; name: string };
      student: { id: string; name: string; nim: string };
      visits: any;
    }>
  > {
    try {
      const url = `${API_URL}${ENDPOINTS.VISITS}/activities/${activityId}/${studentId}`;
      const options = createRequestOptions("GET", undefined, token);
      return fetchWithTimeout<{
        activity: { id: string; name: string };
        student: { id: string; name: string; nim: string };
        visits: any;
      }>(url, options);
    } catch (error) {
      console.error("Error in getVisitsByActivity:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getVisitDetails(
    token: string,
    visitId: number
  ): Promise<ApiResponse<VisitData>> {
    try {
      const url = `${API_URL}${ENDPOINTS.VISITS}/${visitId}`;
      const options = createRequestOptions("GET", undefined, token);
      return fetchWithTimeout<VisitData>(url, options);
    } catch (error) {
      console.error("Error in getVisitDetails:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Get logbook data for a student
  async getLogbook(
    token: string,
    studentId: number,
    activityId: number
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}${ENDPOINTS.LOGBOOKS}/${activityId}/${studentId}`;
      const options = createRequestOptions("GET", undefined, token);
      return fetchWithTimeout<any>(url, options);
    } catch (error) {
      console.error("Error in getLogbook:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Verify a logbook entry
  async verifyLogbook(
    token: string,
    checkOutId: number,
    data: { status: string; notes?: string }
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}${ENDPOINTS.LOGBOOKS}/${checkOutId}/verify`;
      const options = createRequestOptions("POST", data, token);
      return fetchWithTimeout<any>(url, options);
    } catch (error) {
      console.error("Error in verifyLogbook:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getAttendances(
    token: string
  ): Promise<ApiResponse<AttendanceListItem[]>> {
    try {
      const url = `${API_URL}${ENDPOINTS.ATTENDANCES}`;
      const options = createRequestOptions("GET", undefined, token);
      return fetchWithTimeout<AttendanceListItem[]>(url, options);
    } catch (error) {
      console.error("Error in getAttendances:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getAttendanceDetail(
    token: string,
    checkInId: number
  ): Promise<ApiResponse<AttendanceDetail>> {
    try {
      const url = `${API_URL}${ENDPOINTS.ATTENDANCES}/${checkInId}`;
      const options = createRequestOptions("GET", undefined, token);
      return fetchWithTimeout<AttendanceDetail>(url, options);
    } catch (error) {
      console.error("Error in getAttendanceDetail:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async checkInAttendance(
    token: string,
    activityId: number,
    formData: FormData
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}${ENDPOINTS.ATTENDANCES}/${activityId}/check-in`;
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };
      const response = await fetch(url, options);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error in checkInAttendance:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async checkOutAttendance(
    token: string,
    checkInId: number,
    formData: FormData
  ): Promise<ApiResponse<any>> {
    try {
      console.log(checkInId);
      console.log(formData);
      const url = `${API_URL}${ENDPOINTS.ATTENDANCES}/${checkInId}/check-out`;
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      };

      const response = await fetch(url, options);
      console.log(response);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error in checkOutAttendance:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Notification endpoints
  async registerDeviceForNotifications(
    token: string,
    pushToken: string,
    userId: string,
    platform: string
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}/device/register`;
      const options = createRequestOptions(
        "POST",
        {
          push_token: pushToken,
          user_id: userId,
          platform: platform,
        },
        token
      );
      return fetchWithTimeout<any>(url, options);
    } catch (error) {
      console.error("Error in registerDeviceForNotifications:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async sendNotification(
    token: string,
    data: {
      title: string;
      message: string;
      user_id?: string;
      push_token?: string;
      data?: any;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}/notifications/send`;
      const options = createRequestOptions("POST", data, token);
      return fetchWithTimeout<any>(url, options);
    } catch (error) {
      console.error("Error in sendNotification:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async getNotificationHistory(
    token: string,
    userId?: string
  ): Promise<ApiResponse<any>> {
    try {
      const url = `${API_URL}/notifications/history${
        userId ? `?user_id=${userId}` : ""
      }`;
      const options = createRequestOptions("GET", undefined, token);
      return fetchWithTimeout<any>(url, options);
    } catch (error) {
      console.error("Error in getNotificationHistory:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
