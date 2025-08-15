import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Building2,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Save,
  Eye,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

// Mock document data
const mockDocument = {
  id: 'DOC-002',
  appointment_id: 'APT-001',
  document_name: 'Birth Certificate',
  document_type: 'Birth Certificate',
  file_url: '/documents/birth-cert-kasun-001.pdf',
  file_type: 'pdf',
  status: 'pending',
  remarks: '',
  uploaded_at: '2024-01-14T10:15:00',
  appointment: {
    id: 'APT-001',
    reference_no: 'REF-001',
    citizen: {
      name: 'Kasun Perera',
      nic: '199012345678',
      phone: '+94 77 123 4567',
      email: 'kasun.perera@email.com'
    },
    service: {
      name: 'Passport Application',
      department: 'Immigration & Emigration'
    },
    date_time: '2024-01-15T09:00:00',
    appointmentDate: '2024-01-15',
    appointmentTime: '09:00 AM'
  }
};

export const DocumentView = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [document, setDocument] = useState(mockDocument);
  const [remarks, setRemarks] = useState(document.remarks || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handleDocumentAction = async (action) => {
    setIsUpdating(true);
    try {
      // In a real app, this would make an API call
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      setDocument(prev => ({
        ...prev,
        status: newStatus,
        remarks: remarks,
        reviewed_by: user?.name,
        reviewed_at: new Date().toISOString()
      }));
      
      console.log(`Document ${action}d with remarks:`, remarks);
      
      // Show success message and redirect back to appointment details
      setTimeout(() => {
        navigate(`/appointments/${appointmentId}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveRemarks = async () => {
    setIsUpdating(true);
    try {
      // In a real app, this would make an API call
      setDocument(prev => ({
        ...prev,
        remarks: remarks
      }));
      console.log('Remarks saved:', remarks);
    } catch (error) {
      console.error('Error saving remarks:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
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

  const renderDocumentViewer = () => {
    if (document.file_type === 'pdf') {
      return (
        <div className="h-96 border rounded-lg bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">PDF Document Preview</p>
            <p className="text-sm text-gray-500 mb-4">{document.document_name}</p>
            <Button
              variant="outline"
              onClick={() => window.open(document.file_url, '_blank')}
              className="flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Open PDF</span>
            </Button>
          </div>
        </div>
      );
    } else {
      // For image files
      return (
        <div className="border rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Document Preview</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-center">
            <img
              src="/api/placeholder/600/400"
              alt={document.document_name}
              style={{ width: `${zoom}%`, maxWidth: '100%' }}
              className="border rounded shadow-lg mx-auto"
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/appointments/${appointmentId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Appointment</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
            <p className="text-gray-600">{document.document_name} - {document.appointment.reference_no}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={getStatusBadge(document.status)}>
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Document Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Display */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{document.document_name}</span>
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => window.open(document.file_url, '_blank')}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderDocumentViewer()}
            </CardContent>
          </Card>

          {/* Document Review Section */}
          <Card>
            <CardHeader>
              <CardTitle>Document Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add your remarks about this document..."
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
                      onClick={() => handleDocumentAction('reject')}
                      disabled={isUpdating}
                      className="flex items-center space-x-2 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject Document</span>
                    </Button>
                    <Button
                      onClick={() => handleDocumentAction('approve')}
                      disabled={isUpdating}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve Document</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Document Type</label>
                  <p className="font-semibold">{document.document_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">File Type</label>
                  <p className="uppercase">{document.file_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Uploaded Date</label>
                  <p>{new Date(document.uploaded_at).toLocaleDateString()}</p>
                </div>
                {document.reviewed_at && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reviewed Date</label>
                      <p>{new Date(document.reviewed_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reviewed By</label>
                      <p>{document.reviewed_by}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Citizen Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Citizen Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="font-semibold">{document.appointment.citizen.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NIC</label>
                  <p className="font-mono">{document.appointment.citizen.nic}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p>{document.appointment.citizen.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{document.appointment.citizen.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Appointment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="font-semibold">{document.appointment.service.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{document.appointment.service.department}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date & Time</label>
                  <p className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{document.appointment.appointmentDate} at {document.appointment.appointmentTime}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reference</label>
                  <p className="font-mono">{document.appointment.reference_no}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review History */}
          {document.status !== 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {document.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-semibold">
                      {document.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    By: {document.reviewed_by}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(document.reviewed_at).toLocaleString()}
                  </p>
                  {document.remarks && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Remarks</label>
                      <p className="text-sm text-gray-700 italic">"{document.remarks}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
