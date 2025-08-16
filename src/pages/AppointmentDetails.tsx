
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  Save,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Appointment } from '../types';
import { api } from '../utils/api';
import { useAppStore } from '../store/appStore';
import toast from 'react-hot-toast';

export const AppointmentDetails: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { appointments, setAppointments } = useAppStore();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [status, setStatus] = useState<'completed' | 'scheduled' | 'cancelled'>('scheduled');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const appt = appointments.find((a) => a.appointmentId === appointmentId);
    if (appt) {
      setAppointment(appt);
      setStatus(appt.status);
      setNotes(appt.notes);
    }
  }, [appointmentId, appointments]);

  const handleUpdate = async () => {
    if (!appointment) return;

    const { error } = await api.updateAdminAppointment(appointment.appointmentId, {
      status,
      notes,
    });

    if (error) {
      toast.error('Failed to update appointment');
    } else {
      toast.success('Appointment updated successfully');
      const updatedAppointments = appointments.map((a) =>
        a.appointmentId === appointment.appointmentId ? { ...a, status, notes } : a
      );
      setAppointments(updatedAppointments);
      navigate('/appointments');
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    const { error } = await api.deleteAdminAppointment(appointment.appointmentId);

    if (error) {
      toast.error('Failed to delete appointment');
    } else {
      toast.success('Appointment deleted successfully');
      const updatedAppointments = appointments.filter(
        (a) => a.appointmentId !== appointment.appointmentId
      );
      setAppointments(updatedAppointments);
      navigate('/appointments');
    }
  };

  if (!appointment) {
    return <div>Appointment not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/appointments')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Appointments</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-gray-600">{appointment.appointmentId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleUpdate}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Appointment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="text-lg font-semibold">{appointment.service.serviceName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date & Time</label>
                  <p className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{new Date(appointment.appointmentDate).toLocaleDateString()} at {new Date(appointment.appointmentTime).toLocaleTimeString()}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center space-x-2">
                    <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Submitted Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointment.submittedDocuments && appointment.submittedDocuments.length > 0 ? (
                <ul className="space-y-2">
                  {appointment.submittedDocuments.map((doc) => (
                    <li key={doc.documentId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{doc.originalFilename}</p>
                        <p className="text-sm text-gray-500">{doc.mimeType}</p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No documents submitted.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Citizen Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold">{appointment.user.firstName} {appointment.user.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NIC Number</label>
                  <p className="font-mono">{appointment.user.nationalId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact</label>
                  <p>{appointment.user.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p>{appointment.user.address.street}, {appointment.user.address.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
