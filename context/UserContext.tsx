import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { api, LoginResponseData, UserSessionData } from '@/services/api';

// Define user roles
export type UserRole = 'mahasiswa' | 'dosen' | 'kaprodi';

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'absence_auth_token',
  USER_INFO: 'absence_user_info',
};

// Define user context type
type UserContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userInfo: UserSessionData | null;
  setUserInfo: (info: UserSessionData | null) => void;
  isLoggedIn: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
};

// Create the context with a default value
const UserContext = createContext<UserContextType>({
  role: 'mahasiswa',
  setRole: () => {},
  userInfo: null,
  setUserInfo: () => {},
  isLoggedIn: false,
  token: null,
  isLoading: false,
  error: null,
  login: async () => false,
  logout: async () => {},
  verifySession: async () => false,
});

// Create provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('mahasiswa');
  const [userInfo, setUserInfo] = useState<UserSessionData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  // Function to verify if the session is valid
  const verifySession = async (): Promise<boolean> => {
    // Skip verification if we've already verified in this session
    if (isSessionVerified && isLoggedIn && token) return true;
    
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      
      if (!storedToken) {
        // No token found, session is invalid
        return false;
      }
      
      // Check token validity by calling session endpoint silently
      const sessionResponse = await api.getSession(storedToken, true);
      
      if (sessionResponse.success && sessionResponse.data) {
        // Token is valid, session is active
        // Update state with current user data from API
        setUserInfo(sessionResponse.data);
        setRole(sessionResponse.data.role as UserRole);
        setToken(storedToken);
        setIsLoggedIn(true);
        setIsSessionVerified(true);
        
        // Update stored user info with latest data
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_INFO, 
          JSON.stringify(sessionResponse.data)
        );
        
        return true;
      } else {
        // Token is invalid or expired
        console.log('Session invalid or expired, redirecting to login');
        await clearSession();
        return false;
      }
    } catch (err) {
      console.error('Error verifying session:', err);
      await clearSession();
      return false;
    }
  };

  // Function to clear session data
  const clearSession = async () => {
    setRole('mahasiswa');
    setUserInfo(null);
    setIsLoggedIn(false);
    setToken(null);
    setIsSessionVerified(false);
    
    // Clear storage
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER_INFO]);
  };

  // Initialize by checking for stored token and user info
  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        
        if (storedToken) {
          // If token exists, fetch user info
          const storedUserInfoString = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
          
          if (storedUserInfoString) {
            const storedUserInfo = JSON.parse(storedUserInfoString);
            setUserInfo(storedUserInfo);
            setRole(storedUserInfo.role as UserRole);
            setToken(storedToken);
            setIsLoggedIn(true);
            
            // Verify the token is still valid
            verifySession().catch(err => {
              console.error('Error during initial session verification:', err);
            });
          } else {
            // Token exists but no user info, try to fetch session data
            const sessionResponse = await api.getSession(storedToken, true);
            
            if (sessionResponse.success && sessionResponse.data) {
              setUserInfo(sessionResponse.data);
              setRole(sessionResponse.data.role as UserRole);
              setToken(storedToken);
              setIsLoggedIn(true);
              setIsSessionVerified(true);
              await AsyncStorage.setItem(
                STORAGE_KEYS.USER_INFO, 
                JSON.stringify(sessionResponse.data)
              );
            } else {
              // Invalid token, clear storage
              await clearSession();
            }
          }
        }
      } catch (err) {
        console.error('Error loading auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuthState();
  }, []);

  // API-based login
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loginResponse = await api.login(username, password);
      
      if (loginResponse.success && loginResponse.data?.token) {
        const token = loginResponse.data.token;
        
        // Save token to state and storage
        setToken(token);
        await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        
        // Now fetch user session info
        const sessionResponse = await api.getSession(token);
        
        if (sessionResponse.success && sessionResponse.data) {
          // Save user info
          setUserInfo(sessionResponse.data);
          setRole(sessionResponse.data.role as UserRole);
          setIsLoggedIn(true);
          setIsSessionVerified(true);
          
          // Store user info
          await AsyncStorage.setItem(
            STORAGE_KEYS.USER_INFO, 
            JSON.stringify(sessionResponse.data)
          );
          
          return true;
        } else {
          // Failed to get user info
          setError(sessionResponse.message || 'Failed to retrieve user information');
          await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
          setToken(null);
          return false;
        }
      } else {
        setError(loginResponse.message || 'Username atau password salah');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // API-based logout
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      if (token) {
        // Call API to invalidate token
        // await api.logout(token);
      }
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Clear session data
      await clearSession();
      
      // Redirect to login page
      router.replace('/login');
      
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ 
      role, 
      setRole, 
      userInfo, 
      setUserInfo, 
      isLoggedIn, 
      token,
      isLoading,
      error,
      login, 
      logout,
      verifySession 
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Create a hook for using the user context
export const useUser = () => useContext(UserContext); 