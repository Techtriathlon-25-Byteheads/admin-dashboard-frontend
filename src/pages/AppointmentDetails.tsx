import React, { useState, useEffect, useCallback } from 'react';
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
import { api } from '../utils/api';

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

interface BackendAppointmentShape {
  id?: string; appointmentId?: string; userId?: string; citizen_id?: string; serviceId?: string; service_id?: string; officerId?: string; officer_id?: string;
  status?: string; appointmentDate?: string; date_time?: string; appointment_date?: string; appointmentTime?: string; appointment_time?: string;
  requiredDocuments?: string[]; qrCode?: string; qr_code?: string; reference?: string; reference_no?: string; notes?: string; appointment_remarks?: string;
  citizenName?: string; citizen?: { fullName?: string; contactNumber?: string; email?: string; nic?: string };
  serviceName?: string; service?: { serviceName?: string; department?: { departmentName?: string } };
  departmentName?: string; officerName?: string; officer?: { firstName?: string };
}

const mapBackendAppointment = (apt: BackendAppointmentShape): AppointmentWithDocuments => {
  const date = new Date(apt.appointmentDate || apt.date_time || apt.appointment_date || new Date());
  const time = apt.appointmentTime || apt.appointment_time || apt.date_time;
  return {
  id: (apt.appointmentId || apt.id || 'APT') as string,
    citizen_id: apt.userId || apt.citizen_id || '',
    service_id: apt.serviceId || apt.service_id || '',
    officer_id: apt.officerId || apt.officer_id || '',
  status: (apt.status as Appointment['status']) || 'scheduled',
    date_time: apt.appointmentDate || apt.date_time || date.toISOString(),
    documents_json: JSON.stringify(apt.requiredDocuments || []),
    qr_code: apt.qrCode || apt.qr_code || '',
  reference_no: (apt.reference || apt.reference_no || apt.appointmentId || apt.id || 'REF') as string,
    appointment_remarks: apt.notes || apt.appointment_remarks,
    citizenName: apt.citizenName || apt.citizen?.fullName || 'Citizen',
    serviceName: apt.serviceName || apt.service?.serviceName || 'Service',
    departmentName: apt.departmentName || apt.service?.department?.departmentName || 'Department',
    officerName: apt.officerName || apt.officer?.firstName || 'Officer',
    appointmentDate: date.toISOString().split('T')[0],
    appointmentTime: time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
    citizenPhone: apt.citizen?.contactNumber || '+94',
    citizenEmail: apt.citizen?.email || 'unknown@gov.lk',
    citizenNIC: apt.citizen?.nic || 'N/A',
    documents: [],
  };
};

export const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentWithDocuments | null>(null);
  const [appointmentRemarks, setAppointmentRemarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true); setError(null);
    const { data, error: err } = await api.getAdminAppointments();
    if (err) setError(err);
    else if (Array.isArray(data)) {
      const found = data.find((a: BackendAppointmentShape) => (a.appointmentId || a.id) === appointmentId);
      if (found) {
        const mapped = mapBackendAppointment(found);
        setAppointment(mapped);
        setAppointmentRemarks(mapped.appointment_remarks || '');
      } else setError('Appointment not found');
    }
    setLoading(false);
  }, [appointmentId]);

  useEffect(() => { loadAppointment(); }, [loadAppointment]);

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
  if (!appointment) return;
  const newStatus = action === 'approve' ? 'completed' : 'cancelled';
  setAppointment({ ...appointment, status: newStatus, appointment_remarks: appointmentRemarks });
      
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
  if (!appointment) return;
  setAppointment({ ...appointment, appointment_remarks: appointmentRemarks });
      console.log('Remarks saved:', appointmentRemarks);
    } catch (error) {
      console.error('Error saving remarks:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingDocuments = appointment?.documents?.filter((doc) => doc.status === 'pending').length || 0;
  const approvedDocuments = appointment?.documents?.filter((doc) => doc.status === 'approved').length || 0;
  const rejectedDocuments = appointment?.documents?.filter((doc) => doc.status === 'rejected').length || 0;

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
            <p className="text-gray-600">{appointment?.reference_no} - Document Verification</p>
          </div>
        </div>
      </div>
      {loading && <div className="p-4 bg-gray-50 border rounded text-sm">Loading appointment...</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      {!loading && !error && appointment && (
        <>

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
      </>
      )}
    </div>
  );
};
