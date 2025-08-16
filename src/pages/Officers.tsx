import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { api } from '../utils/api';
import { User, Service } from '../types';
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar
} from 'lucide-react';

interface OfficerFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'createdAt' | 'email';
  sortOrder: 'asc' | 'desc';
}

const ServiceAssignment: React.FC<{
  officerForm: any;
  setOfficerForm: (form: any) => void;
  services: Service[];
  serviceSearch: string;
  setServiceSearch: (search: string) => void;
}> = ({ officerForm, setOfficerForm, services, serviceSearch, setServiceSearch }) => {
  const assignedServiceObjects = services.filter(s => officerForm.serviceIds.includes(s.serviceId!));
  const availableServices = services
    .filter(s => !officerForm.serviceIds.includes(s.serviceId!))
    .filter(s => s.serviceName.toLowerCase().includes(serviceSearch.toLowerCase()));

  const addService = (serviceId: string) => {
    setOfficerForm({
      ...officerForm,
      serviceIds: [...officerForm.serviceIds, serviceId],
    });
  };

  const removeService = (serviceId: string) => {
    setOfficerForm({
      ...officerForm,
      serviceIds: officerForm.serviceIds.filter((id: string) => id !== serviceId),
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Assign Services
      </label>
      <div className="grid grid-cols-2 gap-6 h-[300px]">
        {/* Available Services */}
        <div className="flex flex-col space-y-3">
          <h3 className="font-semibold text-base">Available Services</h3>
          <Input
            placeholder="Search services..."
            value={serviceSearch}
            onChange={e => setServiceSearch(e.target.value)}
          />
          <div className="border rounded-md flex-grow overflow-y-auto">
            {availableServices.length > 0 ? (
              availableServices.map(service => (
                <div key={service.serviceId} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{service.serviceName}</p>
                    <p className="text-sm text-gray-500">{service.serviceCategory}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addService(service.serviceId!)}>
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 p-6">No services available.</div>
            )}
          </div>
        </div>

        {/* Assigned Services */}
        <div className="flex flex-col space-y-3">
          <h3 className="font-semibold text-base">Assigned Services ({assignedServiceObjects.length})</h3>
          <div className="border rounded-md flex-grow overflow-y-auto bg-gray-50">
            {assignedServiceObjects.length > 0 ? (
              assignedServiceObjects.map(service => (
                <div key={service.serviceId} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{service.serviceName}</p>
                    <p className="text-sm text-gray-500">{service.serviceCategory}</p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => removeService(service.serviceId!)}>
                    Remove
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 p-6">No services assigned yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export const Officers: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  const [officers, setOfficers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<User | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  
  // Form state
  const [officerForm, setOfficerForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    isActive: true,
    serviceIds: [] as string[]
  });
  
  // Filter states
  const [filters, setFilters] = useState<OfficerFilters>({
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
    newThisMonth: 0
  });

  // Load officers data
  const loadOfficers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getAdminUsers();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const adminUsers = (response.data as User[]) || [];
      setOfficers(adminUsers);
      
      // Calculate statistics
      const active = adminUsers.filter(o => o.isActive).length;
      const inactive = adminUsers.filter(o => !o.isActive).length;
      
      // Calculate new this month
      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth());
      const newThisMonth = adminUsers.filter(o => {
        if (!o.createdAt) return false;
        const createdDate = new Date(o.createdAt);
        return createdDate.getMonth() === thisMonth.getMonth() && 
               createdDate.getFullYear() === thisMonth.getFullYear();
      }).length;
      
      setStats({
        total: adminUsers.length,
        active,
        inactive,
        newThisMonth
      });
      
    } catch (err) {
      console.error('Failed to load officers:', err);
      setError((err as Error).message || 'Failed to load officers');
    } finally {
      setLoading(false);
    }
  };

  // Load services for assignment
  const loadServices = async () => {
    try {
      const response = await api.getServices();
      if (response.data && Array.isArray(response.data)) {
        setServices(response.data as Service[]);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  // Filter and sort officers
  const filteredOfficers = React.useMemo(() => {
    let filtered = [...officers];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(officer => 
        (officer.firstName || '').toLowerCase().includes(search) ||
        (officer.lastName || '').toLowerCase().includes(search) ||
        (officer.email || '').toLowerCase().includes(search)
      );
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(officer => 
        filters.status === 'active' ? officer.isActive : !officer.isActive
      );
    }
    
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
  }, [officers, filters]);

  // Reset form
  const resetForm = () => {
    setOfficerForm({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      isActive: true,
      serviceIds: []
    });
    setServiceSearch('');
  };

  // Handle create officer
  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  // Handle edit officer
  const handleEdit = (officer: User) => {
    setSelectedOfficer(officer);
    const assignedServiceIds = officer.assignedServices?.map(
      (assignment: any) => assignment.service.serviceId
    ) || [];
    setOfficerForm({
      email: officer.email || '',
      firstName: officer.firstName || '',
      lastName: officer.lastName || '',
      password: '',
      confirmPassword: '',
      isActive: officer.isActive,
      serviceIds: assignedServiceIds
    });
    setShowEditModal(true);
  };

  // Handle delete officer
  const handleDeleteClick = (officer: User) => {
    setSelectedOfficer(officer);
    setShowDeleteModal(true);
  };

  // Handle save officer (create or update)
  const handleSave = async (isEdit: boolean = false) => {
    if (!officerForm.email || !officerForm.firstName) {
      setError('Email and first name are required');
      return;
    }

    if (!isEdit && officerForm.password !== officerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isEdit && !officerForm.password) {
      setError('Password is required');
      return;
    }
    
    try {
      setLoading(true);
      
      let response;
      if (isEdit && selectedOfficer) {
        response = await api.updateAdminUser(selectedOfficer.userId!, {
          email: officerForm.email,
          firstName: officerForm.firstName,
          lastName: officerForm.lastName,
          isActive: officerForm.isActive,
          serviceIds: officerForm.serviceIds
        });
      } else {
        response = await api.createAdminUser({
          email: officerForm.email,
          password: officerForm.password,
          firstName: officerForm.firstName,
          lastName: officerForm.lastName,
          serviceIds: officerForm.serviceIds
        });
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedOfficer(null);
      resetForm();
      await loadOfficers();
      
    } catch (err) {
      console.error('Failed to save officer:', err);
      setError((err as Error).message || 'Failed to save officer');
    } finally {
      setLoading(false);
    }
  };

  // Confirm delete officer
  const confirmDelete = async () => {
    if (!selectedOfficer) return;
    
    try {
      setLoading(true);
      const response = await api.deleteAdminUser(selectedOfficer.userId!);
      if (response.error) {
        throw new Error(response.error);
      }
      setShowDeleteModal(false);
      setSelectedOfficer(null);
      await loadOfficers();
    } catch (err) {
      console.error('Failed to delete officer:', err);
      setError((err as Error).message || 'Failed to delete officer');
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (officer: User) => (
        <div>
          <div className="font-medium text-gray-900">
            {`${officer.firstName || ''} ${officer.lastName || ''}`.trim() || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">{officer.role || 'ADMIN'}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (officer: User) => (
        <div className="text-sm text-gray-900">{officer.email || 'No email'}</div>
      ),
    },
    {
      key: 'assignedServices',
      header: 'Assigned Services',
      render: (officer: User) => (
        <div className="text-sm text-gray-900">
          {officer.assignedServices?.length ? 
            `${officer.assignedServices.length} service(s)` : 
            'No services assigned'
          }
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (officer: User) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          officer.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {officer.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (officer: User) => (
        <div className="text-sm text-gray-900">
          {officer.createdAt ? new Date(officer.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (officer: User) => (
        <div className="flex space-x-2">
          {isSuperAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(officer)}
                className="text-green-600 hover:text-green-700"
              >
                <Edit3 size={16} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteClick(officer)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadOfficers();
    loadServices();
  }, []);

  if (loading && officers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading officers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Officers</h1>
          <p className="text-gray-600">Manage admin officers and their service assignments</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate} className="flex items-center space-x-2">
            <Plus size={16} />
            <span>Add Officer</span>
          </Button>
        )}
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
          title="Total Officers"
          value={stats.total.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Officers"
          value={stats.active.toString()}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Inactive Officers"
          value={stats.inactive.toString()}
          icon={UserX}
          color="red"
        />
        <StatCard
          title="New This Month"
          value={stats.newThisMonth.toString()}
          icon={Calendar}
          color="blue"
        />
      </div>



      {/* Officers Table */}
      <Card>
        <Table
          data={filteredOfficers.map(officer => ({ ...officer, id: officer.userId || officer.email || 'unknown' }))}
          columns={columns}
          loading={loading}
          emptyMessage="No officers found"
        />
      </Card>

      {/* Create Officer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Officer"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <Input
                type="text"
                value={officerForm.firstName}
                onChange={(e) => setOfficerForm({ ...officerForm, firstName: e.target.value })}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <Input
                type="text"
                value={officerForm.lastName}
                onChange={(e) => setOfficerForm({ ...officerForm, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <Input
              type="email"
              value={officerForm.email}
              onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <Input
                type="password"
                value={officerForm.password}
                onChange={(e) => setOfficerForm({ ...officerForm, password: e.target.value })}
                placeholder="Enter password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <Input
                type="password"
                value={officerForm.confirmPassword}
                onChange={(e) => setOfficerForm({ ...officerForm, confirmPassword: e.target.value })}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>
          
          <ServiceAssignment 
            officerForm={officerForm}
            setOfficerForm={setOfficerForm}
            services={services}
            serviceSearch={serviceSearch}
            setServiceSearch={setServiceSearch}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(false)}
              loading={loading}
            >
              Create Officer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Officer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOfficer(null);
          resetForm();
        }}
        title="Edit Officer"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <Input
                type="text"
                value={officerForm.firstName}
                onChange={(e) => setOfficerForm({ ...officerForm, firstName: e.target.value })}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <Input
                type="text"
                value={officerForm.lastName}
                onChange={(e) => setOfficerForm({ ...officerForm, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <Input
              type="email"
              value={officerForm.email}
              onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Select
              value={officerForm.isActive ? 'active' : 'inactive'}
              onChange={(e) => setOfficerForm({ ...officerForm, isActive: e.target.value === 'active' })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          
          <ServiceAssignment 
            officerForm={officerForm}
            setOfficerForm={setOfficerForm}
            services={services}
            serviceSearch={serviceSearch}
            setServiceSearch={setServiceSearch}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedOfficer(null);
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSave(true)}
              loading={loading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Officer Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedOfficer(null);
        }}
        title="Delete Officer"
        size="md"
      >
        {selectedOfficer && (
          <div className="space-y-4">
            <p className="text-gray-900">
              Are you sure you want to delete the officer{' '}
              <strong>{selectedOfficer.firstName} {selectedOfficer.lastName}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The officer will lose access to the system and all their service assignments will be removed.
            </p>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedOfficer(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={confirmDelete}
                loading={loading}
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
              >
                Delete Officer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
