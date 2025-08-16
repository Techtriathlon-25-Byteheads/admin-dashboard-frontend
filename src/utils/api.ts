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
    this.name = "ApiError";
    this.status = status;
  }
}

// Get auth token from localStorage (Zustand persistence)
const getAuthToken = (): string | null => {
  try {
    const authStore = localStorage.getItem("gov-portal-auth");
    if (authStore) {
      const parsed = JSON.parse(authStore);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return null;
};

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

// Clear auth data and redirect to login
const handleTokenExpiration = () => {
  localStorage.removeItem("gov-portal-auth");
  window.location.href = "/login";
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
    return { error: "Token expired", status: 401 };
  }

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
        throw new ApiError("Authentication failed", response.status);
      }

      throw new ApiError(
        errorText || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    if (response.status === 204) {
      return { data: {} as T, status: response.status };
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message, status: error.status };
    }
    return { error: "Network error or server unavailable", status: 0 };
  }
}

// API endpoints
export const api = {
  // Analytics
  getAnalytics: () => apiRequest("/analytics"),

  // Admin login
  adminLogin: (email: string, password: string) =>
    apiRequest<{ token: string; user?: object }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Departments
  getDepartments: (sortBy?: string, order?: "asc" | "desc") => {
    const params = new URLSearchParams();
    if (sortBy) params.set("sortBy", sortBy);
    if (order) params.set("order", order);
    return apiRequest(`/departments?${params.toString()}`);
  },
  getDepartmentById: (id: string) => apiRequest(`/departments/${id}`),
  createDepartment: (data: {
    departmentName: string;
    description: string;
    headOfficeAddress: { street: string; city: string };
    contactInfo: { phone: string };
    operatingHours: { [key: string]: string };
  }) =>
    apiRequest("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDepartment: (
    id: string,
    data: {
      departmentName?: string;
      description?: string;
    }
  ) =>
    apiRequest(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteDepartment: (id: string) =>
    apiRequest(`/departments/${id}`, {
      method: "DELETE",
    }),
  associateServiceWithDepartment: (departmentId: string, serviceId: string) =>
    apiRequest(`/departments/${departmentId}/services/${serviceId}`, {
      method: "POST",
    }),
  deleteServiceFromDepartment: (departmentId: string, serviceId: string) =>
    apiRequest(`/departments/${departmentId}/services/${serviceId}`, {
      method: "DELETE",
    }),

  // Services
  getServices: () => apiRequest("/services"),
  getServiceById: (id: string) => apiRequest(`/services/${id}`),
  createService: (data: {
    serviceName: string;
    description: string;
    serviceCategory: string;
    processingTimeDays?: number;
    feeAmount: number;
    requiredDocuments: { usual: Record<string, boolean>; other: string };
    eligibilityCriteria: string;
    onlineAvailable: boolean;
    appointmentRequired: boolean;
    maxCapacityPerSlot: number;
    operationalHours: { [key: string]: string[] };
  }) =>
    apiRequest("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateService: (
    id: string,
    data: {
      serviceName?: string;
      description?: string;
      serviceCategory?: string;
      processingTimeDays?: number;
      feeAmount?: number;
      requiredDocuments?: { usual: Record<string, boolean>; other: string };
      eligibilityCriteria?: string;
      onlineAvailable?: boolean;
      appointmentRequired?: boolean;
      maxCapacityPerSlot?: number;
      isActive?: boolean;
      operationalHours?: { [key: string]: string[] };
    }
  ) =>
    apiRequest(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteService: (id: string) =>
    apiRequest(`/services/${id}`, {
      method: "DELETE",
    }),

  // Admin appointments (scoped by role)
  getAdminAppointments: () => apiRequest("/admin/appointments"),
  getAppointmentById: (id: string) => apiRequest(`/admin/appointments/${id}`),
  createAdminAppointment: (data: {
    userId: string;
    departmentId: string;
    serviceId: string;
    appointmentDate: string; // YYYY-MM-DD
    appointmentTime: string; // HH:mm
    notes?: string;
  }) =>
    apiRequest("/admin/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAdminAppointment: (
    appointmentId: string,
    data: {
      status?: "scheduled" | "confirmed" | "completed" | "cancelled";
      notes?: string;
    }
  ) =>
    apiRequest(`/admin/appointments/${appointmentId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAdminAppointment: (appointmentId: string) =>
    apiRequest(`/admin/appointments/${appointmentId}`, {
      method: "DELETE",
    }),

  // Admin users management (Super Admin only)
  getAdminUsers: () => apiRequest("/admin/admins"),
  getCitizenById: (id: string) => apiRequest(`/admin/users/${id}`),
  createAdminUser: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    serviceIds?: string[];
  }) =>
    apiRequest("/admin/admins", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAdminUser: (
    userId: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      serviceIds?: string[];
    }
  ) =>
    apiRequest(`/admin/admins/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAdminUser: (userId: string) =>
    apiRequest(`/admin/admins/${userId}`, {
      method: "DELETE",
    }),

  // All users (Super Admin only)
  getAllUsers: () => apiRequest("/admin/users"),
  updateUser: (
    userId: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      role?: string;
    }
  ) =>
    apiRequest(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Citizen management functions
  getCitizens: () => apiRequest("/admin/users"),
  updateCitizen: (
    userId: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      fullName?: string;
      nic?: string;
      contactNumber?: string;
      dob?: string;
      address?: { street: string; city: string };
    }
  ) =>
    apiRequest(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Feedback
  getFeedback: () => apiRequest("/feedback"),
  getFeedbackStats: () => apiRequest("/feedback/stats"),
  createFeedback: (data: {
    appointmentId: string;
    rating: number;
    remarks: string;
  }) =>
    apiRequest("/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDocumentsForAppointment: (appointmentId: string) =>
    apiRequest(`/appointments/${appointmentId}/documents`),

  // User profile
  getUserProfile: () => apiRequest("/user/me"),
  updateUserProfile: (data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    nic?: string;
    contactNumber?: string;
    dob?: string;
    address?: { street: string; city: string };
  }) =>
    apiRequest("/user/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
