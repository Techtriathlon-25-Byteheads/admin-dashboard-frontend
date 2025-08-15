import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Building2,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Save
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Appointment } from '../types';

interface AppointmentWithDocuments extends Appointment {
  citizenName: string;
  serviceName: string;
  departmentName: string;
  officerName: string;
  appointmentDate: string;
  appointmentTime: string;
  citizenPhone: string;
  citizenEmail: string;
  citizenNIC: string;
}

// Enhanced mock appointments data for testing different scenarios
const mockAppointments = [
  {
    id: 'APT-001',
    citizen_id: 'C001',
    service_id: 'S001',
    officer_id: 'O001',
    status: 'confirmed',
    date_time: '2024-01-15T09:00:00',
    documents_json: '["nic", "birth_cert", "utility_bill", "photos"]',
    qr_code: 'QR-APT-001',
    reference_no: 'REF-001',
    appointment_remarks: 'Initial passport application. Citizen is applying for first-time passport.',
    citizenName: 'Kasun Perera',
    serviceName: 'Passport Application',
    departmentName: 'Immigration & Emigration',
    officerName: 'Nimal Silva',
    appointmentDate: '2024-01-15',
    appointmentTime: '09:00 AM',
    citizenPhone: '+94 77 123 4567',
    citizenEmail: 'kasun.perera@email.com',
    citizenNIC: '199012345678',
    documents: [
      {
        id: 'DOC-001',
        appointment_id: 'APT-001',
        document_name: 'National Identity Card',
        document_type: 'NIC',
        file_url: '/documents/nic-kasun-001.jpg',
        file_type: 'image',
        status: 'approved',
        remarks: 'Clear and valid NIC copy provided. All details verified.',
        reviewed_by: 'Officer Silva',
        reviewed_at: '2024-01-14T15:30:00',
        uploaded_at: '2024-01-14T10:00:00'
      },
      {
        id: 'DOC-002',
        appointment_id: 'APT-001',
        document_name: 'Birth Certificate',
        document_type: 'Birth Certificate',
        file_url: '/documents/birth-cert-kasun-001.pdf',
        file_type: 'pdf',
        status: 'pending',
        remarks: '',
        uploaded_at: '2024-01-14T10:15:00'
      },
      {
        id: 'DOC-003',
        appointment_id: 'APT-001',
        document_name: 'Utility Bill',
        document_type: 'Proof of Address',
        file_url: '/documents/utility-bill-kasun-001.pdf',
        file_type: 'pdf',
        status: 'rejected',
        remarks: 'Utility bill is older than 3 months (dated 2023-08-15). Please provide a recent bill within the last 90 days.',
        reviewed_by: 'Officer Silva',
        reviewed_at: '2024-01-14T16:00:00',
        uploaded_at: '2024-01-14T10:30:00'
      },
      {
        id: 'DOC-004',
        appointment_id: 'APT-001',
        document_name: 'Passport Photos',
        document_type: 'Passport Size Photographs',
        file_url: '/documents/photos-kasun-001.jpg',
        file_type: 'image',
        status: 'pending',
        remarks: '',
        uploaded_at: '2024-01-14T10:45:00'
      }
    ]
  },
  {
    id: 'APT-002',
    citizen_id: 'C002',
    service_id: 'S002',
    officer_id: 'O002',
    status: 'pending',
    date_time: '2024-01-16T10:30:00',
    documents_json: '["medical_cert", "current_license", "nic"]',
    qr_code: 'QR-APT-002',
    reference_no: 'REF-002',
    appointment_remarks: 'Driving license renewal. Medical examination completed.',
    citizenName: 'Priya Fernando',
    serviceName: 'Driving License Renewal',
    departmentName: 'Motor Traffic Department',
    officerName: 'Sumana Wickramasinghe',
    appointmentDate: '2024-01-16',
    appointmentTime: '10:30 AM',
    citizenPhone: '+94 71 987 6543',
    citizenEmail: 'priya.fernando@email.com',
    citizenNIC: '198506789012',
    documents: [
      {
        id: 'DOC-005',
        appointment_id: 'APT-002',
        document_name: 'Medical Certificate',
        document_type: 'Medical Fitness Certificate',
        file_url: '/documents/medical-priya-002.pdf',
        file_type: 'pdf',
        status: 'approved',
        remarks: 'Valid medical certificate from registered physician Dr. Rajapakse. Valid for 6 months.',
        reviewed_by: 'Medical Officer',
        reviewed_at: '2024-01-15T11:20:00',
        uploaded_at: '2024-01-15T08:45:00'
      },
      {
        id: 'DOC-006',
        appointment_id: 'APT-002',
        document_name: 'Current Driving License',
        document_type: 'Existing License',
        file_url: '/documents/license-priya-002.jpg',
        file_type: 'image',
        status: 'approved',
        remarks: 'Valid license with no traffic violations recorded.',
        reviewed_by: 'Officer Bandara',
        reviewed_at: '2024-01-15T12:30:00',
        uploaded_at: '2024-01-15T08:50:00'
      },
      {
        id: 'DOC-007',
        appointment_id: 'APT-002',
        document_name: 'NIC Copy',
        document_type: 'National Identity Card',
        file_url: '/documents/nic-priya-002.jpg',
        file_type: 'image',
        status: 'pending',
        remarks: '',
        uploaded_at: '2024-01-15T08:55:00'
      }
    ]
  },
  {
    id: 'APT-003',
    citizen_id: 'C003',
    service_id: 'S003',
    officer_id: 'O003',
    status: 'confirmed',
    date_time: '2024-01-17T14:00:00',
    documents_json: '["birth_report", "marriage_cert", "parent_nics"]',
    qr_code: 'QR-APT-003',
    reference_no: 'REF-003',
    appointment_remarks: 'Birth certificate application for newborn child. All hospital documentation ready.',
    citizenName: 'Saman Kumara',
    serviceName: 'Birth Certificate Application',
    departmentName: 'Registrar General\'s Department',
    officerName: 'Kamala Dissanayake',
    appointmentDate: '2024-01-17',
    appointmentTime: '02:00 PM',
    citizenPhone: '+94 75 555 1234',
    citizenEmail: 'saman.kumara@email.com',
    citizenNIC: '198712345678',
    documents: [
      {
        id: 'DOC-008',
        appointment_id: 'APT-003',
        document_name: 'Hospital Birth Report',
        document_type: 'Official Birth Report',
        file_url: '/documents/birth-report-003.pdf',
        file_type: 'pdf',
        status: 'approved',
        remarks: 'Official birth report from Castle Street Hospital. All details verified with hospital records.',
        reviewed_by: 'Registrar Officer',
        reviewed_at: '2024-01-16T09:30:00',
        uploaded_at: '2024-01-16T08:30:00'
      },
      {
        id: 'DOC-009',
        appointment_id: 'APT-003',
        document_name: 'Parents Marriage Certificate',
        document_type: 'Marriage Certificate',
        file_url: '/documents/marriage-cert-003.pdf',
        file_type: 'pdf',
        status: 'rejected',
        remarks: 'Certificate appears to be damaged and text is unclear. Please provide certified copy from Registrar General\'s office.',
        reviewed_by: 'Officer Mendis',
        reviewed_at: '2024-01-16T13:15:00',
        uploaded_at: '2024-01-16T09:35:00'
      },
      {
        id: 'DOC-010',
        appointment_id: 'APT-003',
        document_name: 'Father\'s NIC',
        document_type: 'National Identity Card',
        file_url: '/documents/father-nic-003.jpg',
        file_type: 'image',
        status: 'approved',
        remarks: 'Clear copy, all details visible and verified.',
        reviewed_by: 'Officer Mendis',
        reviewed_at: '2024-01-16T13:20:00',
        uploaded_at: '2024-01-16T09:40:00'
      },
      {
        id: 'DOC-011',
        appointment_id: 'APT-003',
        document_name: 'Mother\'s NIC',
        document_type: 'National Identity Card',
        file_url: '/documents/mother-nic-003.jpg',
        file_type: 'image',
        status: 'approved',
        remarks: 'Clear copy, all details visible and verified.',
        reviewed_by: 'Officer Mendis',
        reviewed_at: '2024-01-16T13:25:00',
        uploaded_at: '2024-01-16T09:45:00'
      }
    ]
  }
];

// Function to get appointment by ID (for demo purposes)
const getAppointmentById = (id) => {
  return mockAppointments.find(apt => apt.id === id) || mockAppointments[0];
};

export const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  // Get the specific appointment based on URL parameter
  const selectedAppointment = getAppointmentById(appointmentId);
  const [appointment, setAppointment] = useState<AppointmentWithDocuments>(selectedAppointment);
  const [appointmentRemarks, setAppointmentRemarks] = useState(appointment.appointment_remarks || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleDocumentClick = (documentId: string) => {
    navigate(`/appointments/${appointmentId}/documents/${documentId}`);
  };

  const handleAppointmentAction = async (action: 'approve' | 'reject') => {
    setIsUpdating(true);
    try {
      // In a real app, this would make an API call
      const newStatus = action === 'approve' ? 'completed' : 'cancelled';
      setAppointment(prev => ({
        ...prev,
        status: newStatus,
        appointment_remarks: appointmentRemarks
      }));
      
      console.log(`Appointment ${action}d with remarks:`, appointmentRemarks);
      
      // Show success message and redirect
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveRemarks = async () => {
    setIsUpdating(true);
    try {
      // In a real app, this would make an API call
      setAppointment(prev => ({
        ...prev,
        appointment_remarks: appointmentRemarks
      }));
      console.log('Remarks saved:', appointmentRemarks);
    } catch (error) {
      console.error('Error saving remarks:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingDocuments = appointment.documents?.filter(doc => doc.status === 'pending').length || 0;
  const approvedDocuments = appointment.documents?.filter(doc => doc.status === 'approved').length || 0;
  const rejectedDocuments = appointment.documents?.filter(doc => doc.status === 'rejected').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/appointments')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Appointments</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-gray-600">{appointment.reference_no} - Document Verification</p>
          </div>
        </div>
      </div>

      {/* Appointment Information - Top Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Appointment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Service</label>
              <p className="text-lg font-semibold">{appointment.serviceName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Department</label>
              <p className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{appointment.departmentName}</span>
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Date & Time</label>
              <p className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{appointment.appointmentDate} at {appointment.appointmentTime}</span>
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Reference Number</label>
              <p className="font-mono">{appointment.reference_no}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Documents and Actions */}
        <div className="lg:col-span-3 space-y-6">
          {/* Uploaded Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Uploaded Documents</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Approved ({approvedDocuments})</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Rejected ({rejectedDocuments})</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span>Pending ({pendingDocuments})</span>
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {appointment.documents?.map((document) => (
                  <div
                    key={document.id}
                    onClick={() => handleDocumentClick(document.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      document.status === 'approved'
                        ? 'border-green-200 bg-green-50 hover:border-green-300'
                        : document.status === 'rejected'
                        ? 'border-red-200 bg-red-50 hover:border-red-300'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(document.status)}
                        <span className={getStatusBadge(document.status)}>
                          {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                        </span>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">{document.document_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Type: {document.document_type}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                    </p>
                    
                    {document.reviewed_at && (
                      <p className="text-xs text-gray-500">
                        Reviewed: {new Date(document.reviewed_at).toLocaleDateString()}
                      </p>
                    )}
                    
                    {document.remarks && (
                      <p className="text-xs text-gray-600 mt-2 italic">
                        "{document.remarks.length > 50 ? document.remarks.substring(0, 50) + '...' : document.remarks}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {(!appointment.documents || appointment.documents.length === 0) && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Remarks & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Appointment Remarks & Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Remarks
                  </label>
                  <textarea
                    value={appointmentRemarks}
                    onChange={(e) => setAppointmentRemarks(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add remarks about this appointment..."
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleSaveRemarks}
                    disabled={isUpdating}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Remarks</span>
                  </Button>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => handleAppointmentAction('reject')}
                      disabled={isUpdating}
                      className="flex items-center space-x-2 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject Appointment</span>
                    </Button>
                    <Button
                      onClick={() => handleAppointmentAction('approve')}
                      disabled={isUpdating}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve Appointment</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Citizen Information */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Citizen Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold">{appointment.citizenName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">NIC Number</label>
                  <p className="font-mono">{appointment.citizenNIC}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact</label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{appointment.citizenPhone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{appointment.citizenEmail}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Colombo 07, Sri Lanka</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-500">Assigned Officer</label>
                  <p className="font-medium">{appointment.officerName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">QR Code</label>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">{appointment.qr_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
