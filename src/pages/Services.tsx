import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table } from '../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { Service, Department } from '../types';
import toast from 'react-hot-toast';

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  department_id: z.string().min(1, 'Department is required'),
  duration_minutes: z.number().min(5, 'Duration must be at least 5 minutes'),
  requirements_json: z.string().optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;

const mockServices: Service[] = [
  { 
    id: '1', 
    name: 'Passport Application', 
    department_id: '1', 
    duration_minutes: 30, 
    requirements_json: '["National ID", "Birth Certificate", "Photos"]' 
  },
  { 
    id: '2', 
    name: 'Visa Application', 
    department_id: '1', 
    duration_minutes: 45, 
    requirements_json: '["Passport", "Application Form", "Supporting Documents"]' 
  },
  { 
    id: '3', 
    name: 'Medical Certificate', 
    department_id: '2', 
    duration_minutes: 20, 
    requirements_json: '["National ID", "Medical Reports"]' 
  },
  { 
    id: '4', 
    name: 'Driver License', 
    department_id: '4', 
    duration_minutes: 25, 
    requirements_json: '["National ID", "Medical Certificate", "Vision Test"]' 
  },
];

export const Services: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { services, setServices, departments, setDepartments } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    // Load departments and services
    const mockDepartments: Department[] = [
      { id: '1', name: 'Immigration Department', description: 'Handles passport and visa services', created_by: '1', created_at: '2024-01-01' },
      { id: '2', name: 'Department of Health', description: 'Medical certificates and health services', created_by: '1', created_at: '2024-01-02' },
      { id: '3', name: 'Ministry of Education', description: 'Educational certificates and school services', created_by: '1', created_at: '2024-01-03' },
      { id: '4', name: 'Department of Motor Traffic', description: 'Vehicle registration and licensing', created_by: '1', created_at: '2024-01-04' },
    ];
    
    setDepartments(mockDepartments);
    
    const servicesWithDepartments = mockServices.map(service => ({
      ...service,
      department: mockDepartments.find(dept => dept.id === service.department_id)
    }));
    
    setServices(servicesWithDepartments);
  }, [setServices, setDepartments]);

  useEffect(() => {
    if (editingService) {
      setValue('name', editingService.name);
      setValue('department_id', editingService.department_id);
      setValue('duration_minutes', editingService.duration_minutes);
      setValue('requirements_json', editingService.requirements_json);
    } else {
      reset();
    }
  }, [editingService, setValue, reset]);

  const handleSave = async (data: ServiceForm) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const department = departments.find(dept => dept.id === data.department_id);

      if (editingService) {
        // Update existing service
        const updated = services.map(service => 
          service.id === editingService.id 
            ? { ...service, ...data, department }
            : service
        );
        setServices(updated);
        toast.success('Service updated successfully');
      } else {
        // Create new service
        const newService: Service = {
          id: Date.now().toString(),
          ...data,
          department,
        };
        setServices([...services, newService]);
        toast.success('Service created successfully');
      }

      setIsModalOpen(false);
      setEditingService(null);
      reset();
    } catch (error) {
      toast.error('Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (service: Service) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const filtered = services.filter(s => s.id !== service.id);
        setServices(filtered);
        toast.success('Service deleted successfully');
      } catch (error) {
        toast.error('Failed to delete service');
      }
    }
  };

  const columns = [
    {
      key: 'name' as keyof Service,
      header: 'Service Name',
      render: (service: Service) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-[#4C9B6F]" />
          <span className="font-medium">{service.name}</span>
        </div>
      ),
    },
    {
      key: 'department' as keyof Service,
      header: 'Department',
      render: (service: Service) => service.department?.name || 'Unknown',
    },
    {
      key: 'duration_minutes' as keyof Service,
      header: 'Duration',
      render: (service: Service) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{service.duration_minutes} min</span>
        </div>
      ),
    },
    {
      key: 'requirements_json' as keyof Service,
      header: 'Requirements',
      render: (service: Service) => {
        try {
          const requirements = JSON.parse(service.requirements_json || '[]');
          return (
            <div className="text-sm">
              {requirements.length > 0 ? `${requirements.length} documents` : 'No requirements'}
            </div>
          );
        } catch {
          return 'Invalid format';
        }
      },
    },
    {
      key: 'id' as keyof Service,
      header: 'Actions',
      render: (service: Service) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(service)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(service)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const departmentOptions = departments.map(dept => ({
    value: dept.id,
    label: dept.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A5E3A]">Services</h1>
          <p className="text-gray-600 mt-1">Manage government services and their requirements</p>
        </div>
        <Button
          onClick={() => {
            setEditingService(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent padding={false}>
          <Table data={services} columns={columns} />
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
          reset();
        }}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Service Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Passport Application"
            />

            <Select
              label="Department"
              {...register('department_id')}
              options={departmentOptions}
              error={errors.department_id?.message}
            />
          </div>

          <Input
            label="Duration (minutes)"
            type="number"
            {...register('duration_minutes', { valueAsNumber: true })}
            error={errors.duration_minutes?.message}
            placeholder="30"
            min="5"
            step="5"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Required Documents (one per line)
            </label>
            <textarea
              {...register('requirements_json')}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#4C9B6F] focus:ring-[#4C9B6F] focus:ring-1"
              placeholder={`National ID Card\nBirth Certificate\nPhotographs\nApplication Form`}
            />
            <p className="text-xs text-gray-500">
              Enter each required document on a new line
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button type="submit" loading={loading}>
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                setEditingService(null);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};