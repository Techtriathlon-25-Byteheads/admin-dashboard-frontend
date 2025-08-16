
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { api } from '../utils/api';
import { Appointment } from '../types';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await api.getAdminAppointments();
    if (error) {
      setError(error);
    } else if (Array.isArray(data)) {
      setAppointments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleViewAppointment = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.appointmentId}`);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.appointmentId}`);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setDeletingAppointment(appointment);
  };

  const confirmDelete = async () => {
    if (!deletingAppointment) return;

    const { error } = await api.deleteAdminAppointment(deletingAppointment.appointmentId);

    if (error) {
      toast.error('Failed to delete appointment');
    } else {
      toast.success('Appointment deleted successfully');
      setAppointments(appointments.filter((a) => a.appointmentId !== deletingAppointment.appointmentId));
    }
    setDeletingAppointment(null);
  };

  const columns = [
    {
      key: 'appointmentId',
      header: 'Appointment ID',
      render: (row: Appointment) => (
        <div className="font-medium text-primary-600">{row.appointmentId}</div>
      ),
    },
    {
      key: 'user',
      header: 'Citizen',
      render: (row: Appointment) => (
        <div>
          <div className="font-medium">{row.user.firstName} {row.user.lastName}</div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (row: Appointment) => (
        <div>
          <div className="font-medium">{row.service.serviceName}</div>
        </div>
      ),
    },
    {
      key: 'appointmentDate',
      header: 'Date & Time',
      render: (row: Appointment) => (
        <div>
          <div className="font-medium">{new Date(row.appointmentDate).toLocaleDateString()}</div>
          <div className="text-sm text-gray-500">{new Date(row.appointmentTime).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Appointment) => (
        <div className="flex items-center space-x-2">
          <span>{row.status}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Appointment) => (
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
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteAppointment(row)}
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
          <h1 className="text-2xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600">Manage all citizen appointments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {loading ? 'Loading appointments...' : `Appointments (${appointments.length})`}
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
          <Table data={appointments} columns={columns} />
        </CardContent>
      </Card>

      <Modal
        isOpen={!!deletingAppointment}
        onClose={() => setDeletingAppointment(null)}
        title="Delete Appointment"
        size="sm"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this appointment?</p>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setDeletingAppointment(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
