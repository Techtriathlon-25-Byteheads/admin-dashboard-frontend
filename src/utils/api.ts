const API_BASE_URL = "https://tt25.tharusha.dev/api";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Get auth token from localStorage (Zustand persistence)
const getAuthToken = (): string | null => {
  try {
    const authStore = localStorage.getItem('gov-portal-auth');
    if (authStore) {
      const parsed = JSON.parse(authStore);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

// Clear auth data and redirect to login
const handleTokenExpiration = () => {
  localStorage.removeItem('gov-portal-auth');
  window.location.href = '/login';
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  // Check token expiration before making request
  if (token && isTokenExpired(token)) {
    handleTokenExpiration();
    return { error: 'Token expired', status: 401 };
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle unauthorized responses
      if (response.status === 401) {
        handleTokenExpiration();
        throw new ApiError('Authentication failed', response.status);
      }
      
      throw new ApiError(errorText || `HTTP error! status: ${response.status}`, response.status);
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    return { error: 'Network error or server unavailable', status: 0 };
  }
}

// API endpoints
export const api = {
  // Analytics
  getAnalytics: () => apiRequest('/v1/analytics'),
  
  // Admin login
  adminLogin: (email: string, password: string) =>
    apiRequest<{ token: string; user?: object }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  // Departments
  getDepartments: () => apiRequest('/departments'),
  
  // Services
  getServices: () => apiRequest('/services'),
  
  // Admin appointments (scoped by role)
  getAdminAppointments: () => apiRequest('/v1/admin/appointments'),
  
  // Admin users management (Super Admin only)
  getAdminUsers: () => apiRequest('/v1/admin/admins'),
  
  // All users (Super Admin only)
  getAllUsers: () => apiRequest('/v1/admin/users'),
};
