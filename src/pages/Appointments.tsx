import React, { useState, useEffect, useCallback } from 'react';
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
  CalendarDays
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { StatCard } from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';
import { Appointment, Analytics } from '../types';
import { api } from '../utils/api';

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

// Helper to map backend appointment object to UI shape
interface BackendAppointmentShape {
  id?: string; appointmentId?: string; userId?: string; citizen_id?: string; serviceId?: string; service_id?: string; officerId?: string; officer_id?: string;
  status: Appointment['status']; appointmentDate?: string; date_time?: string; dateTime?: string; appointmentTime?: string; time?: string;
  requiredDocuments?: string[]; documents?: string[]; qrCode?: string; qr_code?: string; reference?: string; reference_no?: string;
  citizenName?: string; citizen?: { fullName?: string }; user?: { fullName?: string };
  serviceName?: string; service?: { serviceName?: string; department?: { departmentName?: string } };
  departmentName?: string; officerName?: string; officer?: { firstName?: string };
}

const mapAppointment = (apt: BackendAppointmentShape): AppointmentWithDetails => {
  const rawDate: string = (apt.appointmentDate || apt.date_time || apt.dateTime || '') as string;
  const date = rawDate ? new Date(rawDate) : new Date();
  const time: string | undefined = (apt.appointmentTime || apt.time || apt.date_time) as string | undefined;
  return {
  id: (apt.appointmentId || apt.id || '') as string,
  citizen_id: (apt.userId || apt.citizen_id || '') as string,
  service_id: (apt.serviceId || apt.service_id || '') as string,
    officer_id: apt.officerId || apt.officer_id || '',
  status: (apt.status || 'scheduled') as Appointment['status'],
  date_time: (apt.appointmentDate || apt.date_time || rawDate) as string,
    documents_json: JSON.stringify(apt.requiredDocuments || apt.documents || []),
    qr_code: apt.qrCode || apt.qr_code || '',
  reference_no: (apt.reference || apt.reference_no || apt.appointmentId || apt.id || 'REF') as string,
    citizenName: apt.citizenName || apt.citizen?.fullName || apt.user?.fullName || 'Citizen',
    serviceName: apt.serviceName || apt.service?.serviceName || 'Service',
    departmentName: apt.departmentName || apt.service?.department?.departmentName || 'Department',
    officerName: apt.officerName || apt.officer?.firstName || 'Officer',
    appointmentDate: date ? date.toISOString().split('T')[0] : '',
  appointmentTime: time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
  };
};

interface DerivedAppointmentStats {
  totalAppointments: number;
  todayAppointments: number;
  confirmedAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  peakHours: string;
}

const initialStats: DerivedAppointmentStats = {
  totalAppointments: 0,
  todayAppointments: 0,
  confirmedAppointments: 0,
  scheduledAppointments: 0,
  completedAppointments: 0,
  cancelledAppointments: 0,
  peakHours: '-'
};

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DerivedAppointmentStats>(initialStats);

  const loadAnalytics = useCallback(async () => {
    const { data } = await api.getAnalytics();
    if (data) {
      interface QuickStats { completed?: number; pending?: number; cancelled?: number; noShows?: number }
      interface PeakHour { time: string; count: number }
      const a = data as unknown as Analytics & { quickStatsToday?: QuickStats; peakHoursToday?: PeakHour[] };
      setStats({
        totalAppointments: a?.appointmentStats?.totalThisMonth || 0,
        todayAppointments: a?.quickStatsToday?.completed + a?.quickStatsToday?.pending + a?.quickStatsToday?.cancelled || 0,
        confirmedAppointments: a?.quickStatsToday?.pending || 0, // backend distinguishes scheduled/confirmed; using pending as placeholder
        scheduledAppointments: a?.quickStatsToday?.pending || 0,
        completedAppointments: a?.quickStatsToday?.completed || 0,
        cancelledAppointments: a?.quickStatsToday?.cancelled || 0,
        peakHours: a?.peakHoursToday?.length ? `${a.peakHoursToday[0].time}` : '-'
      });
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await api.getAdminAppointments();
    if (error) {
      setError(error);
    } else if (Array.isArray(data)) {
      setAppointments(data.map(mapAppointment));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAppointments(); loadAnalytics(); }, [loadAppointments, loadAnalytics]);

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

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    // optimistic update
    const prev = appointments;
    setAppointments(prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a));
    try {
  // Only allowed status set accepted by backend
      const allowed: Array<Exclude<Appointment['status'], 'pending' | 'no-show'>> = ['scheduled','confirmed','completed','cancelled'];
      const isAllowed = (s: Appointment['status']): s is 'scheduled' | 'confirmed' | 'completed' | 'cancelled' =>
        (allowed as string[]).includes(s);
      const payloadStatus: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' = isAllowed(newStatus) ? newStatus : 'scheduled';
  await api.updateAdminAppointment(appointmentId, { status: payloadStatus, notes });
    } catch {
      // revert on failure
      setAppointments(prev);
    } finally {
      setIsEditModalOpen(false);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Appointments" value={stats.totalAppointments.toLocaleString()} icon={Calendar} />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments.toString()}
          icon={Clock}
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduledAppointments.toString()}
          icon={AlertTriangle}
        />
      </div>

      {/* Additional Stats for Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Completed" value={stats.completedAppointments.toString()} icon={CheckCircle} />
          <StatCard
            title="Cancelled"
            value={stats.cancelledAppointments.toString()}
            icon={XCircle}
          />
          <StatCard
            title="Confirmed" 
            value={stats.confirmedAppointments.toString()}
            icon={AlertTriangle}
          />
          <StatCard
            title="Peak Hours"
            value={stats.peakHours}
            icon={Calendar}
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
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'scheduled', label: 'Scheduled' },
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
                onChange={(e) => setDateFilter(e.target.value)}
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
                  onChange={(e) => setDepartmentFilter(e.target.value)}
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
              {loading ? 'Loading appointments...' : `Appointments (${filteredAppointments.length})`}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAppointments}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {loading ? 'Refreshing' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-4 mb-4 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <Table data={filteredAppointments} columns={columns} />
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
                  variant={selectedAppointment.status === 'confirmed' ? 'primary' : 'outline'}
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                  className="flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm</span>
                </Button>
                <Button
                  variant={selectedAppointment.status === 'completed' ? 'primary' : 'outline'}
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'completed')}
                  className="flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete</span>
                </Button>
                <Button
                  variant={selectedAppointment.status === 'cancelled' ? 'primary' : 'outline'}
                  onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelled')}
                  className="flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                {/* No-Show not directly settable via backend update per current API; intentionally omitted */}
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
