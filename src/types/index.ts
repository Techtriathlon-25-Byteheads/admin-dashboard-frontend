export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'CITIZEN';
  assignedServices?: string[];
  isActive: boolean;
  // Citizen-specific fields
  nic?: string;
  contactNumber?: string;
  dob?: string;
  address?: {
    street: string;
    city: string;
  };
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  departmentId: string;
  departmentName: string;
  description: string;
  headOfficeAddress: {
    street: string;
    city: string;
  };
  contactInfo: {
    phone: string;
  };
  operatingHours: {
    [key: string]: string;
  };
  created_at: string;
  services?: Service[];
  // for backwards compatibility
  name?: string;
}

export interface Service {
  serviceId?: string;
  id?: string; // for backwards compatibility
  serviceName: string;
  description: string;
  serviceCategory: 'licensing' | 'permits' | 'certificates' | 'registration' | 'tax' | 'social' | 'legal' | 'other';
  processingTimeDays?: number;
  feeAmount: number;
  requiredDocuments: {
    usual: Record<string, boolean>;
    other: string;
  };
  eligibilityCriteria: string;
  onlineAvailable: boolean;
  appointmentRequired: boolean;
  maxCapacityPerSlot: number;
  isActive: boolean;
  operationalHours?: {
    [key: string]: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for compatibility
  requirements_json?: string;
  duration_minutes?: number;
}

export interface Officer {
  id: string;
  name: string;
  email: string;
  department_id: string;
  role: string;
  status: 'active' | 'inactive';
  department?: Department;
}

export interface Citizen {
  id: string;
  name: string;
  email: string;
  nic: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface Appointment {
  id: string;
  appointmentId?: string;
  citizen_id: string;
  service_id: string;
  officer_id: string;
  // Backend uses: scheduled | confirmed | completed | cancelled (plus we keep legacy pending/no-show for compatibility)
  status: 'scheduled' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  date_time: string;
  documents_json: string;
  qr_code: string;
  reference_no: string;
  appointment_remarks?: string;
  citizen?: Citizen;
  service?: Service;
  officer?: Officer;
  documents?: Document[];
}

export interface Document {
  id: string;
  appointment_id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_type: 'image' | 'pdf';
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  uploaded_at: string;
}

export interface Feedback {
  id: string;
  appointmentId: string;
  appointment_id: string; // Legacy field for compatibility
  userId?: string;
  rating: number;
  remarks: string;
  comments?: string; // Legacy field for compatibility
  createdAt?: string;
  updatedAt?: string;
  status?: 'new' | 'resolved';
  appointment?: {
    appointmentId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    date_time?: string;
    citizen?: {
      userId?: string;
      fullName?: string;
      name?: string;
    };
    service?: {
      serviceId?: string;
      serviceName?: string;
      name?: string;
      department?: {
        departmentId?: string;
        departmentName?: string;
        name?: string;
      };
    };
  };
}

export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  responseRate: number;
  positiveFeedback: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface Notification {
  id: string;
  appointment_id: string;
  type: 'confirmation' | 'reminder' | 'update';
  status: 'sent' | 'pending' | 'failed';
}

export interface ChatbotTraining {
  id: string;
  content: string;
  tags: string;
}

export interface Analytics {
  appointmentStats: { totalThisMonth: number; percentageChange: number };
  activeServiceStats: { totalThisMonth: number; percentageChange: number };
  officerStats: { totalOfficers: number; percentageChange: number };
  peakHoursToday: { time: string; count: number }[];
  departmentLoad: { departmentName: string; count: number }[];
  quickStatsToday: { completed: number; pending: number; noShows: number; cancelled: number };
}