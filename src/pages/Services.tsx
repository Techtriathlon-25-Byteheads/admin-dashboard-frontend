import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, FileText, Clock, RefreshCw, DollarSign, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { Service } from '../types';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const serviceSchema = z.object({
  serviceName: z
    .string()
    .min(1, 'Service name is required')
    .min(3, 'Service name must be at least 3 characters')
    .max(100, 'Service name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  serviceCategory: z
    .string()
    .min(1, 'Service category is required'),
  processingTimeDays: z
    .number()
    .min(1, 'Processing time must be at least 1 day')
    .max(365, 'Processing time cannot exceed 365 days')
    .optional(),
  feeAmount: z
    .number()
    .min(0, 'Fee amount cannot be negative'),
  eligibilityCriteria: z
    .string()
    .min(1, 'Eligibility criteria is required')
    .min(5, 'Eligibility criteria must be at least 5 characters'),
  onlineAvailable: z.boolean(),
  appointmentRequired: z.boolean(),
  maxCapacityPerSlot: z
    .number()
    .min(1, 'Maximum capacity must be at least 1')
    .max(100, 'Maximum capacity cannot exceed 100'),
});

type ServiceForm = z.infer<typeof serviceSchema>;

const serviceCategories = [
  { value: 'licensing', label: 'Licensing' },
  { value: 'certification', label: 'Certification' },
  { value: 'registration', label: 'Registration' },
  { value: 'permits', label: 'Permits' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'immigration', label: 'Immigration' },
  { value: 'taxation', label: 'Taxation' },
  { value: 'other', label: 'Other' },
];

const requiredDocumentsOptions = [
  { key: 'nic_copy', label: 'National ID Copy' },
  { key: 'birth_certificate', label: 'Birth Certificate' },
  { key: 'passport_copy', label: 'Passport Copy' },
  { key: 'marriage_certificate', label: 'Marriage Certificate' },
  { key: 'medical_certificate', label: 'Medical Certificate' },
  { key: 'educational_certificates', label: 'Educational Certificates' },
  { key: 'employment_letter', label: 'Employment Letter' },
  { key: 'bank_statements', label: 'Bank Statements' },
  { key: 'utility_bills', label: 'Utility Bills' },
  { key: 'police_clearance', label: 'Police Clearance' },
];

export const Services: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<Record<string, boolean>>({});
  
  const { services, setServices } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
  });

  // Load services from API
  const loadServices = useCallback(async () => {
    try {
      setPageLoading(true);
      const response = await api.getServices();
      if (response.data) {
        setServices(response.data as Service[]);
      } else if (response.error) {
        toast.error('Failed to load services: ' + response.error);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setPageLoading(false);
    }
  }, [setServices]);

  const refreshServices = () => {
    loadServices();
  };

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (editingService) {
      setValue('serviceName', editingService.serviceName || editingService.name || '');
      setValue('description', editingService.description || '');
      setValue('serviceCategory', editingService.serviceCategory || '');
      setValue('processingTimeDays', editingService.processingTimeDays || 1);
      setValue('feeAmount', editingService.feeAmount || 0);
      setValue('eligibilityCriteria', editingService.eligibilityCriteria || '');
      setValue('onlineAvailable', editingService.onlineAvailable || false);
      setValue('appointmentRequired', editingService.appointmentRequired || true);
      setValue('maxCapacityPerSlot', editingService.maxCapacityPerSlot || 10);
      
      // Set required documents
      if (editingService.requiredDocuments) {
        setRequiredDocuments(editingService.requiredDocuments);
      } else if (editingService.requirements_json) {
        // Handle legacy format
        try {
          const requirements = JSON.parse(editingService.requirements_json);
          const docs: Record<string, boolean> = {};
          if (Array.isArray(requirements)) {
            requirements.forEach(req => {
              docs[req.toLowerCase().replace(/\s+/g, '_')] = true;
            });
          }
          setRequiredDocuments(docs);
        } catch {
          setRequiredDocuments({});
        }
      }
    } else {
      reset();
      setRequiredDocuments({});
    }
  }, [editingService, setValue, reset]);

  const handleSave = async (data: ServiceForm) => {
    setLoading(true);
    try {
      const serviceData = {
        ...data,
        requiredDocuments,
      };

      if (editingService) {
        // Update existing service
        const serviceId = editingService.serviceId || editingService.id;
        if (!serviceId) throw new Error('Service ID is missing');
        
        const response = await api.updateService(serviceId, serviceData);
        if (response.data) {
          const updatedServices = services.map(service => 
            (service.serviceId || service.id) === serviceId 
              ? { ...service, ...serviceData }
              : service
          );
          setServices(updatedServices);
          toast.success('Service updated successfully');
        } else if (response.error) {
          throw new Error(response.error);
        }
      } else {
        // Create new service
        const response = await api.createService(serviceData);
        if (response.data) {
          const newService = response.data as Service;
          setServices([...services, newService]);
          toast.success('Service created successfully');
        } else if (response.error) {
          throw new Error(response.error);
        }
      }

      setIsModalOpen(false);
      setEditingService(null);
      reset();
      setRequiredDocuments({});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save service';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setDeletingService(service);
  };

  const confirmDelete = async () => {
    if (!deletingService) return;

    try {
      const serviceId = deletingService.serviceId || deletingService.id;
      if (!serviceId) throw new Error('Service ID is missing');
      
      const response = await api.deleteService(serviceId);
      if (response.status === 200 || response.status === 204) {
        const filtered = services.filter(service => 
          (service.serviceId || service.id) !== serviceId
        );
        setServices(filtered);
        toast.success('Service deleted successfully');
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete service';
      toast.error(errorMessage);
    } finally {
      setDeletingService(null);
    }
  };

  const handleDocumentToggle = (docKey: string, checked: boolean) => {
    setRequiredDocuments(prev => ({
      ...prev,
      [docKey]: checked
    }));
  };

  const columns = [
    {
      key: 'serviceName' as keyof Service,
      header: 'Service Name',
      render: (service: Service) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary-500" />
          <div>
            <span className="font-medium">{service.serviceName || service.name}</span>
            <p className="text-xs text-gray-500">{service.serviceCategory}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description' as keyof Service,
      header: 'Description',
      render: (service: Service) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 truncate">{service.description}</p>
        </div>
      ),
    },
    {
      key: 'feeAmount' as keyof Service,
      header: 'Fee',
      render: (service: Service) => (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="font-medium">LKR {service.feeAmount?.toLocaleString() || '0'}</span>
        </div>
      ),
    },
    {
      key: 'maxCapacityPerSlot' as keyof Service,
      header: 'Capacity',
      render: (service: Service) => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-blue-500" />
          <span>{service.maxCapacityPerSlot || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'processingTimeDays' as keyof Service,
      header: 'Processing Time',
      render: (service: Service) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-orange-500" />
          <span>{service.processingTimeDays || service.duration_minutes || 'N/A'} {service.processingTimeDays ? 'days' : 'minutes'}</span>
        </div>
      ),
    },
    {
      key: 'isActive' as keyof Service,
      header: 'Status',
      render: (service: Service) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          service.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {service.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
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
            onClick={() => handleDeleteClick(service)}
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
          <h1 className="text-2xl font-bold text-primary-600">Services</h1>
          <p className="text-gray-600 mt-1">Manage government services and their configurations</p>
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
          <div className="flex items-center justify-between">
            <CardTitle>All Services ({services.length})</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshServices}
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
              <div className="text-gray-500">Loading services...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No services found. Create your first service.</div>
            </div>
          ) : (
            <Table 
              data={services.map(service => ({ 
                ...service, 
                id: service.serviceId || service.id || '' 
              }))} 
              columns={columns as any} 
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
          reset();
          setRequiredDocuments({});
        }}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Service Name"
              {...register('serviceName')}
              error={errors.serviceName?.message}
              placeholder="e.g., New Driving License"
              disabled={loading}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Service Category *
              </label>
              <select
                {...register('serviceCategory')}
                disabled={loading}
                className={`
                  block w-full rounded-md border-gray-300 shadow-sm 
                  focus:border-primary-500 focus:ring-primary-500 focus:ring-1
                  disabled:bg-gray-50 disabled:cursor-not-allowed
                  ${errors.serviceCategory ? 'border-red-300' : ''}
                `}
              >
                <option value="">Select a category</option>
                {serviceCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.serviceCategory && (
                <p className="text-sm text-red-600">{errors.serviceCategory.message}</p>
              )}
            </div>

            <Input
              label="Processing Time (Days)"
              type="number"
              {...register('processingTimeDays', { valueAsNumber: true })}
              error={errors.processingTimeDays?.message}
              placeholder="14"
              disabled={loading}
            />

            <Input
              label="Fee Amount (LKR)"
              type="number"
              step="0.01"
              {...register('feeAmount', { valueAsNumber: true })}
              error={errors.feeAmount?.message}
              placeholder="1500.00"
              disabled={loading}
            />

            <Input
              label="Max Capacity Per Slot"
              type="number"
              {...register('maxCapacityPerSlot', { valueAsNumber: true })}
              error={errors.maxCapacityPerSlot?.message}
              placeholder="10"
              disabled={loading}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Service Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('onlineAvailable')}
                    disabled={loading}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">Available Online</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('appointmentRequired')}
                    disabled={loading}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">Appointment Required</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={3}
              disabled={loading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-primary-500 focus:ring-primary-500 focus:ring-1
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${errors.description ? 'border-red-300' : ''}
              `}
              placeholder="Detailed description of the service (minimum 10 characters)"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Eligibility Criteria *
            </label>
            <textarea
              {...register('eligibilityCriteria')}
              rows={2}
              disabled={loading}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-primary-500 focus:ring-primary-500 focus:ring-1
                disabled:bg-gray-50 disabled:cursor-not-allowed
                ${errors.eligibilityCriteria ? 'border-red-300' : ''}
              `}
              placeholder="e.g., Must be over 18 years old"
            />
            {errors.eligibilityCriteria && (
              <p className="text-sm text-red-600">{errors.eligibilityCriteria.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Required Documents
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {requiredDocumentsOptions.map(doc => (
                <label key={doc.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={requiredDocuments[doc.key] || false}
                    onChange={(e) => handleDocumentToggle(doc.key, e.target.checked)}
                    disabled={loading}
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">{doc.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Select the documents that citizens need to provide for this service.
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t">
            <Button type="submit" loading={loading} disabled={loading}>
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => {
                setIsModalOpen(false);
                setEditingService(null);
                reset();
                setRequiredDocuments({});
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        title="Delete Service"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Delete "{deletingService?.serviceName || deletingService?.name}"?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All appointments for this service will also be affected.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Service
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDeletingService(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};