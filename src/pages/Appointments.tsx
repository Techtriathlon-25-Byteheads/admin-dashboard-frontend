import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  User, 
  Building2,
  Search,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RotateCcw,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Timer
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { StatCard } from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';
import { Appointment } from '../types';

interface AppointmentWithDetails extends Appointment {
  citizenName: string;
  serviceName: string;
  departmentName: string;
  officerName: string;
  appointmentDate: string;
  appointmentTime: string;
  estimatedWaitTime?: number;
  queuePosition?: number;
}

// Mock data for demonstration
const mockAppointments: AppointmentWithDetails[] = [
  {
    id: 'APT-001',
    citizen_id: 'C001',
    service_id: 'S001',
    officer_id: 'O001',
    status: 'confirmed',
    date_time: '2024-01-15T09:00:00',
    documents_json: '["nic", "passport"]',
    qr_code: 'QR-APT-001',
    reference_no: 'REF-001',
    citizenName: 'Kasun Perera',
    serviceName: 'Passport Application',
    departmentName: 'Immigration & Emigration',
    officerName: 'Nimal Silva',
    appointmentDate: '2024-01-15',
    appointmentTime: '09:00 AM',
    estimatedWaitTime: 15,
    queuePosition: 3
  },
  {
    id: 'APT-002',
    citizen_id: 'C002',
    service_id: 'S002',
    officer_id: 'O002',
    status: 'pending',
    date_time: '2024-01-15T10:30:00',
    documents_json: '["nic", "birth_cert"]',
    qr_code: 'QR-APT-002',
    reference_no: 'REF-002',
    citizenName: 'Amara Fernando',
    serviceName: 'Birth Certificate',
    departmentName: 'Registrar General',
    officerName: 'Sunil Rathnayake',
    appointmentDate: '2024-01-15',
    appointmentTime: '10:30 AM',
    estimatedWaitTime: 25,
    queuePosition: 7
  },
  {
    id: 'APT-003',
    citizen_id: 'C003',
    service_id: 'S003',
    officer_id: 'O003',
    status: 'completed',
    date_time: '2024-01-14T14:00:00',
    documents_json: '["nic", "license"]',
    qr_code: 'QR-APT-003',
    reference_no: 'REF-003',
    citizenName: 'Priya Jayawardena',
    serviceName: 'License Renewal',
    departmentName: 'Motor Traffic',
    officerName: 'Rohana Wijesinghe',
    appointmentDate: '2024-01-14',
    appointmentTime: '02:00 PM',
    estimatedWaitTime: 0,
    queuePosition: 0
  },
  {
    id: 'APT-004',
    citizen_id: 'C004',
    service_id: 'S004',
    officer_id: 'O004',
    status: 'cancelled',
    date_time: '2024-01-16T11:00:00',
    documents_json: '["nic", "tax_docs"]',
    qr_code: 'QR-APT-004',
    reference_no: 'REF-004',
    citizenName: 'Ruwan Dissanayake',
    serviceName: 'Tax Registration',
    departmentName: 'Inland Revenue',
    officerName: 'Kamani Gunathilake',
    appointmentDate: '2024-01-16',
    appointmentTime: '11:00 AM',
    estimatedWaitTime: 0,
    queuePosition: 0
  },
  {
    id: 'APT-005',
    citizen_id: 'C005',
    service_id: 'S005',
    officer_id: 'O005',
    status: 'no-show',
    date_time: '2024-01-14T16:30:00',
    documents_json: '["nic", "income_cert"]',
    qr_code: 'QR-APT-005',
    reference_no: 'REF-005',
    citizenName: 'Lakshmi Rajapakse',
    serviceName: 'Income Certificate',
    departmentName: 'Grama Niladhari',
    officerName: 'Saman Kumara',
    appointmentDate: '2024-01-14',
    appointmentTime: '04:30 PM',
    estimatedWaitTime: 0,
    queuePosition: 0
  }
];

const appointmentStats = {
  totalAppointments: 1245,
  todayAppointments: 87,
  confirmedAppointments: 952,
  pendingAppointments: 123,
  completedAppointments: 1089,
  cancelledAppointments: 67,
  noShowAppointments: 89,
  averageWaitTime: 22,
  averageServiceTime: 18,
  peakHours: '10:00 AM - 12:00 PM'
};

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(mockAppointments);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>(mockAppointments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Filter appointments based on search and filters
  useEffect(() => {
    let filtered = appointments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reference_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      
      switch (dateFilter) {
        case 'today': {
          filtered = filtered.filter(appointment => {
            const apptDate = new Date(appointment.date_time);
            return apptDate.toDateString() === today.toDateString();
          });
          break;
        }
        case 'tomorrow': {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filtered = filtered.filter(appointment => {
            const apptDate = new Date(appointment.date_time);
            return apptDate.toDateString() === tomorrow.toDateString();
          });
          break;
        }
        case 'this_week': {
          const oneWeekFromNow = new Date(today);
          oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
          filtered = filtered.filter(appointment => {
            const apptDate = new Date(appointment.date_time);
            return apptDate >= today && apptDate <= oneWeekFromNow;
          });
          break;
        }
      }
    }

    // Department filter (for admin only)
    if (departmentFilter !== 'all' && isAdmin) {
      filtered = filtered.filter(appointment => appointment.departmentName === departmentFilter);
    }

    setFilteredAppointments(filtered);
  }, [searchTerm, statusFilter, dateFilter, departmentFilter, appointments, isAdmin]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'no-show':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'no-show':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleStatusUpdate = (appointmentId, newStatus) => {
    setAppointments(prev =>
      prev.map(appointment =>
        appointment.id === appointmentId
          ? { ...appointment, status: newStatus }
          : appointment
      )
    );
    setIsEditModalOpen(false);
  };

  const handleViewAppointment = (appointment: AppointmentWithDetails) => {
    navigate(`/appointments/${appointment.id}`);
  };

  const handleEditAppointment = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setNotes('');
    setIsEditModalOpen(true);
  };

  const exportAppointments = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting appointments...', filteredAppointments);
  };

  const columns = [
    {
      key: 'reference_no',
      header: 'Reference No.',
      render: (row: AppointmentWithDetails) => (
        <div className="font-medium text-primary-600">{row.reference_no}</div>
      )
    },
    {
      key: 'citizenName',
      header: 'Citizen',
      render: (row: AppointmentWithDetails) => (
        <div>
          <div className="font-medium">{row.citizenName}</div>
          <div className="text-sm text-gray-500">ID: {row.citizen_id}</div>
        </div>
      )
    },
    {
      key: 'serviceName',
      header: 'Service',
      render: (row: AppointmentWithDetails) => (
        <div>
          <div className="font-medium">{row.serviceName}</div>
          <div className="text-sm text-gray-500">{row.departmentName}</div>
        </div>
      )
    },
    {
      key: 'date_time',
      header: 'Date & Time',
      render: (row: AppointmentWithDetails) => (
        <div>
          <div className="font-medium">{row.appointmentDate}</div>
          <div className="text-sm text-gray-500">{row.appointmentTime}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: AppointmentWithDetails) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <span className={getStatusBadge(row.status)}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        </div>
      )
    },
    ...(isAdmin ? [{
      key: 'officerName',
      header: 'Officer',
      render: (row: AppointmentWithDetails) => (
        <div className="text-sm">{row.officerName}</div>
      )
    }] : []),
    {
      key: 'queuePosition',
      header: 'Queue Info',
      render: (row: AppointmentWithDetails) => (
        <div className="text-sm">
          {row.status === 'confirmed' && row.queuePosition ? (
            <>
              <div>Position: #{row.queuePosition}</div>
              <div className="text-gray-500">Wait: ~{row.estimatedWaitTime}m</div>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: AppointmentWithDetails) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewAppointment(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditAppointment(row)}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? "Manage all citizen appointments across departments" 
              : "Manage appointments for your department"
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={exportAppointments}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button 
            onClick={() => setIsCalendarModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Calendar View</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Appointments"
          value={appointmentStats.totalAppointments.toLocaleString()}
          icon={Calendar}
          trend="+12%"
          trendDirection="up"
        />
        <StatCard
          title="Today's Appointments"
          value={appointmentStats.todayAppointments.toString()}
          icon={Clock}
          trend="+5%"
          trendDirection="up"
        />
        <StatCard
          title="Pending Confirmation"
          value={appointmentStats.pendingAppointments.toString()}
          icon={AlertTriangle}
          trend="-8%"
          trendDirection="down"
        />
        <StatCard
          title="Avg. Wait Time"
          value={`${appointmentStats.averageWaitTime}m`}
          icon={Timer}
          trend="-3m"
          trendDirection="down"
        />
      </div>

      {/* Additional Stats for Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Completed"
            value={appointmentStats.completedAppointments.toString()}
            icon={CheckCircle}
            trend="+15%"
            trendDirection="up"
          />
          <StatCard
            title="Cancelled"
            value={appointmentStats.cancelledAppointments.toString()}
            icon={XCircle}
            trend="+2%"
            trendDirection="up"
          />
          <StatCard
            title="No-Shows"
            value={appointmentStats.noShowAppointments.toString()}
            icon={AlertTriangle}
            trend="-5%"
            trendDirection="down"
          />
          <StatCard
            title="Peak Hours"
            value={appointmentStats.peakHours}
            icon={Calendar}
            trend="Stable"
            trendDirection="neutral"
          />
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, reference, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'no-show', label: 'No-Show' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <Select
                value={dateFilter}
                onChange={setDateFilter}
                options={[
                  { value: 'all', label: 'All Dates' },
                  { value: 'today', label: 'Today' },
                  { value: 'tomorrow', label: 'Tomorrow' },
                  { value: 'this_week', label: 'This Week' },
                  { value: 'next_week', label: 'Next Week' }
                ]}
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <Select
                  value={departmentFilter}
                  onChange={setDepartmentFilter}
                  options={[
                    { value: 'all', label: 'All Departments' },
                    { value: 'Immigration & Emigration', label: 'Immigration & Emigration' },
                    { value: 'Registrar General', label: 'Registrar General' },
                    { value: 'Motor Traffic', label: 'Motor Traffic' },
                    { value: 'Inland Revenue', label: 'Inland Revenue' },
                    { value: 'Grama Niladhari', label: 'Grama Niladhari' }
                  ]}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Appointments ({filteredAppointments.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            data={filteredAppointments}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* View Appointment Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedAppointment.reference_no}</h3>
                <p className="text-gray-600">{selectedAppointment.serviceName}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(selectedAppointment.status)}
                <span className={getStatusBadge(selectedAppointment.status)}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Citizen Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Citizen Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedAppointment.citizenName}</p>
                      <p className="text-sm text-gray-500">ID: {selectedAppointment.citizen_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">+94 77 123 4567</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">citizen@example.com</span>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Appointment Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedAppointment.appointmentDate}</p>
                      <p className="text-sm text-gray-500">{selectedAppointment.appointmentTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedAppointment.departmentName}</p>
                      <p className="text-sm text-gray-500">Officer: {selectedAppointment.officerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Main Office, Colombo 01</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Queue Information */}
            {selectedAppointment.status === 'confirmed' && selectedAppointment.queuePosition && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Queue Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Queue Position</p>
                    <p className="font-semibold text-blue-900">#{selectedAppointment.queuePosition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Estimated Wait Time</p>
                    <p className="font-semibold text-blue-900">~{selectedAppointment.estimatedWaitTime} minutes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Required Documents</h4>
              <div className="flex flex-wrap gap-2">
                {JSON.parse(selectedAppointment.documents_json).map((doc: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {doc.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">QR Code</h4>
              <p className="text-sm text-gray-600 font-mono">{selectedAppointment.qr_code}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Appointment"
        size="md"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedAppointment.reference_no}</h3>
              <p className="text-gray-600">{selectedAppointment.citizenName} - {selectedAppointment.serviceName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedAppointment.status === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                  className="flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm</span>
                </Button>
                <Button
                  variant={selectedAppointment.status === 'completed' ? 'default' : 'outline'}
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}
                  className="flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete</span>
                </Button>
                <Button
                  variant={selectedAppointment.status === 'cancelled' ? 'default' : 'outline'}
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelled')}
                  className="flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                <Button
                  variant={selectedAppointment.status === 'no-show' ? 'default' : 'outline'}
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'no-show')}
                  className="flex items-center justify-center space-x-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>No-Show</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Notes/Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add any notes or remarks about this appointment..."
              />
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                onClick={() => setIsEditModalOpen(false)}
                className="flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Save Notes</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Calendar View Modal */}
      <Modal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        title="Appointment Calendar"
        size="xl"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Calendar Management Features</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Configure available time slots for services</li>
              <li>• Monitor appointment slots availability and queue sizes</li>
              <li>• Handle appointment booking conflicts and capacity management</li>
              <li>• Interactive calendar for managing scheduled appointments</li>
            </ul>
          </div>
          
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Interactive Calendar View</p>
            <p className="text-sm text-gray-500 mt-2">
              This would show a full calendar interface with appointment slots,
              availability management, and drag-and-drop rescheduling capabilities.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
