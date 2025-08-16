import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Building2, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { Department } from '../types';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const departmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Department name is required')
    .min(3, 'Department name must be at least 3 characters')
    .max(100, 'Department name must be less than 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

export const Departments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  
  const { departments, setDepartments } = useAppStore();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
  });

  // Load departments from API
  const loadDepartments = useCallback(async () => {
    try {
      setPageLoading(true);
      const response = await api.getDepartments();
      if (response.data) {
        setDepartments(response.data as Department[]);
      } else if (response.error) {
        toast.error('Failed to load departments: ' + response.error);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setPageLoading(false);
    }
  }, [setDepartments]);

  const refreshDepartments = () => {
    loadDepartments();
  };

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    if (editingDepartment) {
      setValue('name', editingDepartment.name);
      setValue('description', editingDepartment.description);
    } else {
      reset();
    }
  }, [editingDepartment, setValue, reset]);

  const handleSave = async (data: DepartmentForm) => {
    setLoading(true);
    try {
      if (editingDepartment) {
        // Update existing department
        const response = await api.updateDepartment(editingDepartment.id, data);
        if (response.data) {
          const updated = departments.map(dept => 
            dept.id === editingDepartment.id 
              ? { ...dept, ...data }
              : dept
          );
          setDepartments(updated);
          toast.success('Department updated successfully');
        } else if (response.error) {
          throw new Error(response.error);
        }
      } else {
        // Create new department
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
      const response = await api.deleteDepartment(deletingDepartment.id);
      if (response.status === 200 || response.status === 204) {
        const filtered = departments.filter(dept => dept.id !== deletingDepartment.id);
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

  const columns = [
    {
      key: 'name' as keyof Department,
      header: 'Department Name',
      render: (dept: Department) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-primary-500" />
          <span className="font-medium">{dept.name}</span>
        </div>
      ),
    },
    {
      key: 'description' as keyof Department,
      header: 'Description',
    },
    {
      key: 'created_at' as keyof Department,
      header: 'Created Date',
      render: (dept: Department) => new Date(dept.created_at).toLocaleDateString(),
    },
    {
      key: 'id' as keyof Department,
      header: 'Actions',
      render: (dept: Department) => (
        <div className="flex items-center space-x-2">
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
              onClick={refreshDepartments}
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
        size="md"
      >
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <Input
            label="Department Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g., Immigration Department"
            disabled={loading}
          />

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
              placeholder="Describe the department's services and responsibilities (minimum 10 characters)"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Provide a detailed description of the department's role and services.
            </p>
          </div>

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

      {/* Delete Confirmation Modal */}
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
                Delete "{deletingDepartment?.name}"?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All associated services will also be deleted.
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