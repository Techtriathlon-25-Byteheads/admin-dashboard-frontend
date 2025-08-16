import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Building2, RefreshCw, ArrowUpDown, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { Department, Service } from '../types';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

import { Select } from '../components/ui/Select';

const cities = [
  'Colombo',
  'Sri Jayawardenepura Kotte',
  'Dehiwala-Mount Lavinia',
  'Moratuwa',
  'Negombo',
  'Kandy',
  'Kalmunai',
  'Trincomalee',
  'Galle',
  'Jaffna',
  'Kurunegala',
  'Matale',
  'Katunayake',
  'Dambulla',
  'Anuradhapura',
  'Ratnapura',
  'Badulla',
  'Matara',
  'Puttalam',
  'Vavuniya',
  'Panadura',
];

const departmentSchema = z.object({
  departmentName: z
    .string()
    .min(1, 'Department name is required')
    .min(3, 'Department name must be at least 3 characters')
    .max(100, 'Department name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  headOfficeAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
  }),
  contactInfo: z.object({
    phone: z.string().min(1, 'Phone number is required'),
  }),
  operatingHours: z.record(z.string(), z.string()).optional(),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

export const Departments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [managingServicesDept, setManagingServicesDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [sortBy, setSortBy] = useState<'city' | 'departmentName'>('departmentName');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const { departments, setDepartments, services, setServices } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      departmentName: '',
      description: '',
      headOfficeAddress: { street: '', city: 'Colombo' },
      contactInfo: { phone: '' },
      operatingHours: { 'monday-friday': '' },
    },
  });

  const loadData = useCallback(async () => {
    try {
      setPageLoading(true);
      const [deptResponse, servicesResponse] = await Promise.all([
        api.getDepartments(sortBy, order),
        api.getServices(),
      ]);

      if (deptResponse.data) {
        setDepartments(deptResponse.data as Department[]);
      } else if (deptResponse.error) {
        toast.error('Failed to load departments: ' + deptResponse.error);
      }

      if (servicesResponse.data) {
        setServices(servicesResponse.data as Service[]);
      } else if (servicesResponse.error) {
        toast.error('Failed to load services: ' + servicesResponse.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setPageLoading(false);
    }
  }, [setDepartments, setServices, sortBy, order]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (editingDepartment) {
      const formValues = {
        departmentName: editingDepartment.departmentName,
        description: editingDepartment.description,
        headOfficeAddress: editingDepartment.headOfficeAddress,
        contactInfo: editingDepartment.contactInfo,
        operatingHours: {
          'monday-friday': editingDepartment.operatingHours?.['monday-friday'] || ''
        },
      };
      reset(formValues);
    } else {
      reset();
    }
  }, [editingDepartment, reset]);

  const handleSave = async (data: DepartmentForm) => {
    console.log('Editing department:', editingDepartment);
    setLoading(true);
    try {
      if (editingDepartment) {
        const response = await api.updateDepartment(editingDepartment.departmentId, data);
        if (response.data) {
          const updated = departments.map(dept =>
            dept.departmentId === editingDepartment.departmentId
              ? { ...dept, ...response.data }
              : dept
          );
          setDepartments(updated);
          toast.success('Department updated successfully');
        } else if (response.error) {
          throw new Error(response.error);
        }
      } else {
        const response = await api.createDepartment(data);
        if (response.data) {
          const newDepartment = response.data as Department;
          setDepartments([...departments, newDepartment]);
          toast.success('Department created successfully');
        } else if (response.error) {
          throw new Error(response.error);
        }
      }

      setIsModalOpen(false);
      setEditingDepartment(null);
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save department';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (department: Department) => {
    setDeletingDepartment(department);
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) return;

    try {
      const response = await api.deleteDepartment(deletingDepartment.departmentId);
      if (response.status === 200 || response.status === 204) {
        const filtered = departments.filter(dept => dept.departmentId !== deletingDepartment.departmentId);
        setDepartments(filtered);
        toast.success('Department deleted successfully');
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete department';
      toast.error(errorMessage);
    } finally {
      setDeletingDepartment(null);
    }
  };

  const handleSort = (field: 'city' | 'departmentName') => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  };

  const [serviceSearch, setServiceSearch] = useState('');
  const [assignedServices, setAssignedServices] = useState<Service[]>([]);

  const handleManageServices = (department: Department) => {
    setManagingServicesDept(department);
    setAssignedServices(department.services || []);
    setIsServicesModalOpen(true);
  };

  const handleSaveServices = async () => {
    if (!managingServicesDept) return;

    const originalServiceIds = new Set(managingServicesDept.services?.map(s => s.serviceId) || []);
    const newServiceIds = new Set(assignedServices.map(s => s.serviceId));

    const servicesToAdd = assignedServices.filter(s => !originalServiceIds.has(s.serviceId));
    const servicesToRemove = managingServicesDept.services?.filter(s => !newServiceIds.has(s.serviceId)) || [];

    setLoading(true);
    try {
      const promises = [
        ...servicesToAdd.map(s => api.associateServiceWithDepartment(managingServicesDept.departmentId, s.serviceId!)),
        ...servicesToRemove.map(s => api.deleteServiceFromDepartment(managingServicesDept.departmentId, s.serviceId!))
      ];

      await Promise.all(promises);

      toast.success('Services updated successfully');
      setIsServicesModalOpen(false);
      loadData(); // Refresh all data
    } catch (error) {
      toast.error('Failed to update services');
    } finally {
      setLoading(false);
    }
  };

  const availableServices = services
    .filter(s => !assignedServices.some(as => as.serviceId === s.serviceId))
    .filter(s => s.serviceName.toLowerCase().includes(serviceSearch.toLowerCase()));

  const columns = [
    {
      key: 'departmentName' as keyof Department,
      header: (
        <Button variant="ghost" onClick={() => handleSort('departmentName')}>
          Department Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      render: (dept: Department) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-primary-500" />
          <span className="font-medium">{dept.departmentName}</span>
        </div>
      ),
    },
    {
      key: 'headOfficeAddress' as keyof Department,
      header: (
        <Button variant="ghost" onClick={() => handleSort('city')}>
          City
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      render: (dept: Department) => dept.headOfficeAddress.city,
    },
    {
      key: 'contactInfo' as keyof Department,
      header: 'Contact',
      render: (dept: Department) => dept.contactInfo.phone,
    },
    {
      key: 'services',
      header: 'Services',
      render: (dept: Department) => (
        <div className="text-sm text-gray-600">
          {dept.services && dept.services.length > 0 ? (
            <span>{dept.services.length} assigned</span>
          ) : (
            <span className="text-gray-400">No services</span>
          )}
        </div>
      ),
    },
    {
      key: 'departmentId' as keyof Department,
      header: 'Actions',
      render: (dept: Department) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleManageServices(dept)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Services
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(dept)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(dept)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-600">Departments</h1>
          <p className="text-gray-600 mt-1">Manage government departments and their services</p>
        </div>
        <Button
          onClick={() => {
            setEditingDepartment(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Departments ({departments.length})</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadData()}
              disabled={pageLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${pageLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pageLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading departments...</div>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No departments found. Create your first department.</div>
            </div>
          ) : (
            <Table data={departments} columns={columns} />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDepartment(null);
          reset();
        }}
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <Input
            label="Department Name"
            {...register('departmentName')}
            error={errors.departmentName?.message}
            placeholder="e.g., Immigration Department"
            disabled={loading}
          />
          <Input
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Describe the department's services..."
            disabled={loading}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Street"
              {...register('headOfficeAddress.street')}
              error={errors.headOfficeAddress?.street?.message}
              placeholder="123 Main St"
              disabled={loading}
            />
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <select
                id="city"
                {...register('headOfficeAddress.city')}
                defaultValue={editingDepartment?.headOfficeAddress.city || cities[0]}
                className={`
                  block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 focus:ring-1
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${errors.headOfficeAddress?.city ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
                `}
                disabled={loading}
              >
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.headOfficeAddress?.city && (
                <p className="text-sm text-red-600">{errors.headOfficeAddress.city.message}</p>
              )}
            </div>
          </div>
          <Input
            label="Phone Number"
            {...register('contactInfo.phone')}
            error={errors.contactInfo?.phone?.message}
            placeholder="+94112233445"
            disabled={loading}
          />
          {/* TODO: Add a better UI for operating hours */}
          <Input
            label="Operating Hours (Monday-Friday)"
            {...register('operatingHours.monday-friday')}
            error={errors.operatingHours?.['monday-friday']?.message}
            placeholder="9am-5pm"
            disabled={loading}
          />

          <div className="flex items-center space-x-3 pt-4 border-t">
            <Button type="submit" loading={loading} disabled={loading}>
              {editingDepartment ? 'Update Department' : 'Create Department'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => {
                setIsModalOpen(false);
                setEditingDepartment(null);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        title={`Manage Services for ${managingServicesDept?.departmentName}`}
        size="2xl"
      >
        <div className="grid grid-cols-2 gap-6 h-[500px]">
          {/* Available Services */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-semibold text-lg">Available Services</h3>
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
                    <Button size="sm" variant="outline" onClick={() => setAssignedServices([...assignedServices, service])}>
                      Add
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 p-6">No more services available.</div>
              )}
            </div>
          </div>

          {/* Assigned Services */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-semibold text-lg">Assigned Services ({assignedServices.length})</h3>
            <div className="border rounded-md flex-grow overflow-y-auto bg-gray-50">
              {assignedServices.length > 0 ? (
                assignedServices.map(service => (
                  <div key={service.serviceId} className="p-3 border-b last:border-b-0 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-gray-500">{service.serviceCategory}</p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => setAssignedServices(assignedServices.filter(s => s.serviceId !== service.serviceId))}>
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
        <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
          <Button variant="ghost" onClick={() => setIsServicesModalOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSaveServices} loading={loading} disabled={loading}>Save Changes</Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deletingDepartment}
        onClose={() => setDeletingDepartment(null)}
        title="Delete Department"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Delete "{deletingDepartment?.departmentName}"?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Department
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeletingDepartment(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
