import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
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
import toast from 'react-hot-toast';

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().min(1, 'Description is required'),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

const mockDepartments: Department[] = [
  { id: '1', name: 'Immigration Department', description: 'Handles passport and visa services', created_by: '1', created_at: '2024-01-01' },
  { id: '2', name: 'Department of Health', description: 'Medical certificates and health services', created_by: '1', created_at: '2024-01-02' },
  { id: '3', name: 'Ministry of Education', description: 'Educational certificates and school services', created_by: '1', created_at: '2024-01-03' },
  { id: '4', name: 'Department of Motor Traffic', description: 'Vehicle registration and licensing', created_by: '1', created_at: '2024-01-04' },
];

export const Departments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  
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

  useEffect(() => {
    // Load departments
    setDepartments(mockDepartments);
  }, [setDepartments]);

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
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingDepartment) {
        // Update existing department
        const updated = departments.map(dept => 
          dept.id === editingDepartment.id 
            ? { ...dept, ...data }
            : dept
        );
        setDepartments(updated);
        toast.success('Department updated successfully');
      } else {
        // Create new department
        const newDepartment: Department = {
          id: Date.now().toString(),
          ...data,
          created_by: '1',
          created_at: new Date().toISOString(),
        };
        setDepartments([...departments, newDepartment]);
        toast.success('Department created successfully');
      }

      setIsModalOpen(false);
      setEditingDepartment(null);
      reset();
    } catch (error) {
      toast.error('Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleDelete = async (department: Department) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        const filtered = departments.filter(dept => dept.id !== department.id);
        setDepartments(filtered);
        toast.success('Department deleted successfully');
      } catch (error) {
        toast.error('Failed to delete department');
      }
    }
  };

  const columns = [
    {
      key: 'name' as keyof Department,
      header: 'Department Name',
      render: (dept: Department) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-[#4C9B6F]" />
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
            onClick={() => handleDelete(dept)}
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
          <h1 className="text-2xl font-bold text-[#1A5E3A]">Departments</h1>
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
          <CardTitle>All Departments ({departments.length})</CardTitle>
        </CardHeader>
        <CardContent padding={false}>
          <Table data={departments} columns={columns} />
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
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-[#4C9B6F] focus:ring-[#4C9B6F] focus:ring-1
                ${errors.description ? 'border-red-300' : ''}
              `}
              placeholder="Describe the department's services and responsibilities"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button type="submit" loading={loading}>
              {editingDepartment ? 'Update Department' : 'Create Department'}
            </Button>
            <Button
              type="button"
              variant="ghost"
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
    </div>
  );
};