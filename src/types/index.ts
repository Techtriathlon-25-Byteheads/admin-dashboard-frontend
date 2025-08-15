export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'officer';
  department_id?: string;
  status: 'active' | 'inactive';
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
  totalAppointments: number;
  totalDepartments: number;
  totalOfficers: number;
  totalCitizens: number;
  averageWaitTime: number;
  satisfactionScore: number;
  noShowRate: number;
  peakHours: { hour: string; count: number }[];
  departmentLoad: { department: string; count: number }[];
  processingTimes: { date: string; avgTime: number }[];
}