

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
    other: string[];
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



export interface Appointment {
  appointmentId: string;
  userId: string;
  departmentId: string;
  serviceId: string;
  reportId: string | null;
  appointmentDate: string;
  appointmentTime: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  appointmentType: 'new_application' | 'other';
  priorityLevel: 'normal' | 'high';
  queueNumber: number | null;
  estimatedDuration: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  service: Service;
  submittedDocuments: SubmittedDocument[];
}

export interface SubmittedDocument {
  documentId: string;
  appointmentId: string;
  externalDocumentId: string;
  filePath: string;
  mimeType: string;
  originalFilename: string;
  fileSizeBytes: number;
  isApproved: boolean;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  appointment_id: string;
  rating: number;
  comments: string;
  appointment?: Appointment;
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