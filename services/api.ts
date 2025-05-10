import { API_URL, API_TIMEOUT } from '@/constants/Config';
import { UserRole } from '@/context/UserContext';

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

// Error handling for fetch
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
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
      'Content-Type': 'application/json',
      Accept: 'application/json',
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
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();
    
    if (!response.ok) {
      throw new ApiError(
        data.message || 'An error occurred during the API request',
        response.status
      );
    }
    
    return data as ApiResponse<T>;
  } catch (error) {
    // Only log errors for non-silent calls
    if (!isSilent && error instanceof Error && error.name !== 'AbortError') {
      console.error('API error:', error);
    }
    
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
      };
    }
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        message: 'Request timeout',
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// API functions
export const api = {
  // Authentication
  login: async (username: string, password: string): Promise<ApiResponse<LoginResponseData>> => {
    const url = `${API_URL}/auth/login`;
    console.log(url);
    const options = createRequestOptions('POST', { username, password });
    return fetchWithTimeout<LoginResponseData>(url, options);
  },
  
  // Get user session (profile)
  getSession: async (token: string, isSilent: boolean = false): Promise<ApiResponse<UserSessionData>> => {
    const url = `${API_URL}/auth/session`;
    const options = createRequestOptions('GET', undefined, token);
    return fetchWithTimeout<UserSessionData>(url, options, isSilent);
  },
  
  // Logout (invalidate token)
  logout: async (token: string): Promise<ApiResponse<null>> => {
    const url = `${API_URL}/auth/logout`;
    const options = createRequestOptions('POST', undefined, token);
    return fetchWithTimeout<null>(url, options);
  },
}; 