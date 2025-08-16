import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { api } from '../utils/api';
import { User, Appointment } from '../types'; // Using User for citizens
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Edit3, 
  Eye, // Re-adding Eye for View Appointments
  Calendar,
  ClipboardList
} from 'lucide-react';

interface CitizenFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'createdAt' | 'email';
  sortOrder: 'asc' | 'desc';
}

export const Citizens: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const [citizens, setCitizens] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<User | null>(null);
  const [citizenAppointments, setCitizenAppointments] = useState<Appointment[]>([]);
  
  // Form state for editing citizen
  const [citizenForm, setCitizenForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
    },
    isActive: true,
  });
  
  // Filter states
  const [filters, setFilters] = useState<CitizenFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'desc'
  });
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newThisMonth: 0 // Placeholder, might not be directly available from API
  });

  // Load citizens data
  const loadCitizens = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getCitizens();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const citizenUsers = (response.data as User[]) || [];
      setCitizens(citizenUsers);
      
      // Calculate statistics
      const active = citizenUsers.filter(c => c.isActive).length;
      const inactive = citizenUsers.filter(c => !c.isActive).length;
      
      // Placeholder for new this month - API doesn't provide this directly for citizens
      // You might need to filter by createdAt if available and within the current month
      const newThisMonth = 0; 
      
      setStats({
        total: citizenUsers.length,
        active,
        inactive,
        newThisMonth
      });
      
    } catch (err) {
      console.error('Failed to load citizens:', err);
      setError((err as Error).message || 'Failed to load citizens');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort citizens
  const filteredCitizens = useMemo(() => {
    let filtered = [...citizens];
    
    // Apply search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(citizen => 
        (citizen.firstName || '').toLowerCase().includes(search) ||
        (citizen.lastName || '').toLowerCase().includes(search) ||
        (citizen.email || '').toLowerCase().includes(search) ||
        (citizen.nic || '').toLowerCase().includes(search) ||
        (citizen.phone || '').toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(citizen => 
        filters.status === 'active' ? citizen.isActive : !citizen.isActive
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date = '';
      let bValue: string | number | Date = '';
      
      switch (filters.sortBy) {
        case 'name':
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || '');
          bValue = new Date(b.createdAt || '');
          break;
        default:
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
      }
      
      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [citizens, filters]);

  // Reset form
  const resetForm = () => {
    setCitizenForm({
      firstName: '',
      lastName: '',
      phone: '',
      nationalId: '',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
      },
      isActive: true,
    });
  };

  // Handle edit citizen
  const handleEdit = (citizen: User) => {
    setSelectedCitizen(citizen);
    setCitizenForm({
      firstName: citizen.firstName || '',
      lastName: citizen.lastName || '',
      phone: citizen.phone || '',
      nationalId: citizen.nationalId || '',
      dateOfBirth: citizen.dateOfBirth ? citizen.dateOfBirth.split('T')[0] : '', // Format for date input
      address: {
        street: citizen.address?.street || '',
        city: citizen.address?.city || '',
      },
      isActive: citizen.isActive,
    });
    setShowEditModal(true);
  };

  // Handle save citizen (update)
  const handleSave = async () => {
    if (!selectedCitizen) return;

    if (!citizenForm.firstName) { // Only firstName is required now
      setError('First name is required');
      return;
    }

    try {
      setLoading(true);

      const response = await api.updateCitizen(selectedCitizen.userId!, {
        firstName: citizenForm.firstName,
        lastName: citizenForm.lastName,
        phone: citizenForm.phone,
        nationalId: citizenForm.nationalId,
        dateOfBirth: citizenForm.dateOfBirth,
        address: citizenForm.address,
        isActive: citizenForm.isActive,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setShowEditModal(false);
      setSelectedCitizen(null);
      resetForm();
      await loadCitizens(); // Reload data

    } catch (err) {
      console.error('Failed to save citizen:', err);
      setError((err as Error).message || 'Failed to save citizen');
    } finally {
      setLoading(false);
    }
  };

  // Handle view appointments
  const handleViewAppointments = async (citizen: User) => {
    setSelectedCitizen(citizen);
    setCitizenAppointments([]); // Clear previous appointments
    try {
      setLoading(true);
      const response = await api.getCitizenAppointments(citizen.userId!);
      if (response.error) {
        throw new Error(response.error);
      }
      setCitizenAppointments((response.data as Appointment[]) || []);
      setShowAppointmentsModal(true);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError((err as Error).message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'firstName',
      header: 'Name',
      render: (citizen: User) => (
        <div>
          <div className="font-medium text-gray-900">
            {`${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">{citizen.role || 'CITIZEN'}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (citizen: User) => (
        <div className="text-sm text-gray-900">
          {citizen.phone || 'N/A'}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (citizen: User) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          citizen.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {citizen.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (citizen: User) => (
        <div className="text-sm text-gray-900">
          {citizen.createdAt ? new Date(citizen.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (citizen: User) => (
        <div className="flex space-x-2">
          {isSuperAdmin && ( // Only Super Admin can edit/view appointments
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(citizen)}
                className="text-green-600 hover:text-green-700"
              >
                <Edit3 size={16} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewAppointments(citizen)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Eye size={16} /> {/* Changed icon to Eye */}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Columns for Appointments Table
  const appointmentColumns = [

    {
      key: 'service',
      header: 'Service',
      render: (appt: Appointment) => appt.service?.serviceName || 'N/A',
    },
    {
      key: 'department',
      header: 'Department',
      render: (appt: Appointment) => appt.department?.departmentName || 'N/A',
    },
    {
      key: 'date_time',
      header: 'Date & Time',
      render: (appt: Appointment) => new Date(appt.date_time).toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appt: Appointment) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          appt.status === 'completed' 
            ? 'bg-green-100 text-green-800' 
            : appt.status === 'cancelled' 
            ? 'bg-red-100 text-red-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {appt.status}
        </span>
      ),
    },
    {
      key: 'appointmentType',
      header: 'Type',
      render: (appt: Appointment) => appt.appointmentType || 'N/A',
    },
    {
      key: 'priorityLevel',
      header: 'Priority',
      render: (appt: Appointment) => appt.priorityLevel || 'N/A',
    },
    {
      key: 'estimatedDuration',
      header: 'Duration (min)',
      render: (appt: Appointment) => appt.estimatedDuration || 'N/A',
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (appt: Appointment) => appt.notes || 'N/A',
    },
    {
      key: 'serviceCategory',
      header: 'Service Category',
      render: (appt: Appointment) => appt.service?.serviceCategory || 'N/A',
    },
    {
      key: 'serviceFee',
      header: 'Service Fee',
      render: (appt: Appointment) => appt.service?.feeAmount ? `LKR ${appt.service.feeAmount}` : 'N/A',
    },
    {
      key: 'submittedDocuments',
      header: 'Documents',
      render: (appt: Appointment) => appt.submittedDocuments?.length > 0 ? `${appt.submittedDocuments.length} uploaded` : 'None',
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (appt: Appointment) => appt.createdAt ? new Date(appt.createdAt).toLocaleString() : 'N/A',
    },
    {
      key: 'updatedAt',
      header: 'Updated At',
      render: (appt: Appointment) => appt.updatedAt ? new Date(appt.updatedAt).toLocaleString() : 'N/A',
    },
  ];

  useEffect(() => {
    loadCitizens();
  }, []);

  if (loading && citizens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading citizens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citizens</h1>
          <p className="text-gray-600">Manage citizen user accounts</p>
        </div>
        {/* No "Add Citizen" button as per API docs */}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Citizens"
          value={stats.total.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Citizens"
          value={stats.active.toString()}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Inactive Citizens"
          value={stats.inactive.toString()}
          icon={UserX}
          color="red"
        />
      </div>

     

      {/* Citizens Table */}
      <Card>
        <Table
          data={filteredCitizens.map(citizen => ({ ...citizen, id: citizen.userId || citizen.email || 'unknown' }))}
          columns={columns}
          loading={loading}
          emptyMessage="No citizens found"
        />
      </Card>

      {/* Edit Citizen Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCitizen(null);
          resetForm();
        }}
        title="Edit Citizen"
        size="lg"
      >
        {selectedCitizen && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <Input
                  type="text"
                  value={citizenForm.firstName}
                  onChange={(e) => setCitizenForm({ ...citizenForm, firstName: e.target.value })}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <Input
                  type="text"
                  value={citizenForm.lastName}
                  onChange={(e) => setCitizenForm({ ...citizenForm, lastName: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                type="text"
                value={citizenForm.phone}
                onChange={(e) => setCitizenForm({ ...citizenForm, phone: e.target.value })}
                placeholder="+94771234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                National ID
              </label>
              <Input
                type="text"
                value={citizenForm.nationalId}
                onChange={(e) => setCitizenForm({ ...citizenForm, nationalId: e.target.value })}
                placeholder="e.g., 123456789V"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <Input
                type="date"
                value={citizenForm.dateOfBirth}
                onChange={(e) => setCitizenForm({ ...citizenForm, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Street
                </label>
                <Input
                  type="text"
                  value={citizenForm.address.street}
                  onChange={(e) => setCitizenForm({ ...citizenForm, address: { ...citizenForm.address, street: e.target.value } })}
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address City
                </label>
                <Input
                  type="text"
                  value={citizenForm.address.city}
                  onChange={(e) => setCitizenForm({ ...citizenForm, address: { ...citizenForm.address, city: e.target.value } })}
                  placeholder="Colombo"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={citizenForm.isActive ? 'active' : 'inactive'}
                onChange={(e) => setCitizenForm({ ...citizenForm, isActive: e.target.value === 'active' })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCitizen(null);
                  resetForm();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={loading}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Appointments Modal */}
      <Modal
        isOpen={showAppointmentsModal}
        onClose={() => {
          setShowAppointmentsModal(false);
          setSelectedCitizen(null);
          setCitizenAppointments([]);
        }}
        title={`Appointments for ${selectedCitizen?.firstName} ${selectedCitizen?.lastName}`}
        size="xl"
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          </div>
        ) : citizenAppointments.length === 0 ? (
          <div className="text-center text-gray-500 p-6">No appointments found for this citizen.</div>
        ) : (
          <Table
            data={citizenAppointments.map(appt => ({ ...appt, id: appt.id || 'unknown' }))}
            columns={appointmentColumns}
            loading={loading}
            emptyMessage="No appointments found"
          />
        )}
      </Modal>
    </div>
  );
};