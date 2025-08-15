export interface User {
  userId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  assignedServices?: string[];
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  services?: Service[];
}

export interface Service {
  id: string;
  department_id: string;
  name: string;
  requirements_json: string;
  duration_minutes: number;
  department?: Department;
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
  citizen_id: string;
  service_id: string;
  officer_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
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