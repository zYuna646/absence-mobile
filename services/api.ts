import { API_URL, API_TIMEOUT, ENDPOINTS } from "@/constants/Config";
import { UserRole } from "@/context/UserContext";

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
      console.log("API Request:", url, 
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
      data = responseText ? JSON.parse(responseText) : { success: false, message: "Empty response" };
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return {
        success: false,
        message: `Invalid response format: ${responseText.substring(0, 100)}...`,
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
        data = responseText ? JSON.parse(responseText) : { success: false, message: "Empty response" };
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        return {
          success: false,
          message: `Invalid response format: ${responseText.substring(0, 100)}...`,
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
    token: string
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}/students/my-logbooks`;
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
  getStudentStatistics: async (
    token: string
  ): Promise<ApiResponse<any>> => {
    const url = `${API_URL}/students/statistics`;
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
        data = responseText ? JSON.parse(responseText) : { success: false, message: "Empty response" };
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        return {
          success: false,
          message: `Invalid response format: ${responseText.substring(0, 100)}...`,
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
      password: data.password
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
      password: data.password
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
  getActivities: async (token: string): Promise<ApiResponse<ActivityData[]>> => {
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
  getClinicAdvisors: async (token: string): Promise<ApiResponse<ClinicAdvisorData[]>> => {
    const url = `${API_URL}${ENDPOINTS.ADVISORS_CLINICS}`;
    const options = createRequestOptions("GET", undefined, token);
    return fetchWithTimeout<ClinicAdvisorData[]>(url, options);
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
};
