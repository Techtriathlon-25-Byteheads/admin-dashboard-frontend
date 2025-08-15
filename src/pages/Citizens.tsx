import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  Eye,
  Edit3,
  Plus,
  Download,
  RotateCcw,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  FileText,
  Star
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { StatCard } from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';
import { Citizen } from '../types';

interface CitizenWithDetails extends Citizen {
  totalAppointments: number;
  completedAppointments: number;
  lastAppointmentDate?: string;
  registrationDate: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  documentStatus: 'complete' | 'incomplete' | 'pending_review';
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  preferredLanguage?: 'sinhala' | 'tamil' | 'english';
  emergencyContact?: string;
  occupation?: string;
  lastLoginDate?: string;
  averageRating?: number;
}

// Mock data for demonstration
const mockCitizens: CitizenWithDetails[] = [
  {
    id: 'C001',
    name: 'Kasun Perera',
    email: 'kasun.perera@email.com',
    nic: '199012345678',
    phone: '+94771234567',
    status: 'active',
    totalAppointments: 5,
    completedAppointments: 4,
    lastAppointmentDate: '2024-01-10',
    registrationDate: '2023-06-15',
    verificationStatus: 'verified',
    documentStatus: 'complete',
    address: 'No. 123, Galle Road, Colombo 03',
    dateOfBirth: '1990-03-15',
    gender: 'male',
    preferredLanguage: 'english',
    emergencyContact: '+94771234568',
    occupation: 'Software Engineer',
    lastLoginDate: '2024-01-12',
    averageRating: 4.8
  },
  {
    id: 'C002',
    name: 'Amara Fernando',
    email: 'amara.fernando@email.com',
    nic: '198807654321',
    phone: '+94777654321',
    status: 'active',
    totalAppointments: 3,
    completedAppointments: 2,
    lastAppointmentDate: '2024-01-08',
    registrationDate: '2023-08-22',
    verificationStatus: 'verified',
    documentStatus: 'complete',
    address: 'No. 456, Kandy Road, Kandy',
    dateOfBirth: '1988-11-20',
    gender: 'female',
    preferredLanguage: 'sinhala',
    emergencyContact: '+94777654322',
    occupation: 'Teacher',
    lastLoginDate: '2024-01-11',
    averageRating: 4.5
  },
  {
    id: 'C003',
    name: 'Priya Jayawardena',
    email: 'priya.jayawardena@email.com',
    nic: '199205432109',
    phone: '+94765432109',
    status: 'active',
    totalAppointments: 8,
    completedAppointments: 7,
    lastAppointmentDate: '2024-01-14',
    registrationDate: '2023-04-10',
    verificationStatus: 'verified',
    documentStatus: 'complete',
    address: 'No. 789, Main Street, Galle',
    dateOfBirth: '1992-07-08',
    gender: 'female',
    preferredLanguage: 'english',
    emergencyContact: '+94765432110',
    occupation: 'Doctor',
    lastLoginDate: '2024-01-15',
    averageRating: 4.9
  },
  {
    id: 'C004',
    name: 'Ruwan Dissanayake',
    email: 'ruwan.dissanayake@email.com',
    nic: '198512345432',
    phone: '+94712345432',
    status: 'inactive',
    totalAppointments: 2,
    completedAppointments: 1,
    lastAppointmentDate: '2023-12-05',
    registrationDate: '2023-09-18',
    verificationStatus: 'pending',
    documentStatus: 'incomplete',
    address: 'No. 321, Hospital Road, Matara',
    dateOfBirth: '1985-09-12',
    gender: 'male',
    preferredLanguage: 'sinhala',
    emergencyContact: '+94712345433',
    occupation: 'Business Owner',
    lastLoginDate: '2023-12-20',
    averageRating: 3.8
  },
  {
    id: 'C005',
    name: 'Lakshmi Rajapakse',
    email: 'lakshmi.rajapakse@email.com',
    nic: '199611223344',
    phone: '+94781122334',
    status: 'active',
    totalAppointments: 1,
    completedAppointments: 0,
    registrationDate: '2024-01-05',
    verificationStatus: 'rejected',
    documentStatus: 'pending_review',
    address: 'No. 654, Temple Road, Anuradhapura',
    dateOfBirth: '1996-05-18',
    gender: 'female',
    preferredLanguage: 'tamil',
    emergencyContact: '+94781122335',
    occupation: 'Student',
    lastLoginDate: '2024-01-14',
    averageRating: 0
  }
];

const citizenStats = {
  totalCitizens: 2891,
  activeCitizens: 2654,
  newRegistrations: 47,
  verifiedCitizens: 2589,
  pendingVerifications: 156,
  rejectedVerifications: 146,
  averageRating: 4.6,
  totalAppointments: 8945,
  completedAppointments: 7821,
  citizenSatisfaction: 92.5
};

export const Citizens: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  
  const [citizens, setCitizens] = useState<CitizenWithDetails[]>(mockCitizens);
  const [filteredCitizens, setFilteredCitizens] = useState<CitizenWithDetails[]>(mockCitizens);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenWithDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newCitizen, setNewCitizen] = useState({
    name: '',
    email: '',
    nic: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'male',
    preferredLanguage: 'english',
    emergencyContact: '',
    occupation: ''
  });

  // Filter citizens based on search and filters
  useEffect(() => {
    let filtered = citizens;

    // Role-based filtering - Officers see citizens only from their department's appointments
    if (!isAdmin) {
      // In a real app, this would filter by department-related citizens
      filtered = citizens;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(citizen =>
        citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizen.phone.includes(searchTerm) ||
        citizen.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(citizen => citizen.status === statusFilter);
    }

    setFilteredCitizens(filtered);
  }, [searchTerm, statusFilter, citizens, isAdmin]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleViewCitizen = (citizen: CitizenWithDetails) => {
    setSelectedCitizen(citizen);
    setIsViewModalOpen(true);
  };

  const handleEditCitizen = (citizen: CitizenWithDetails) => {
    setSelectedCitizen(citizen);
    setNewCitizen({
      name: citizen.name,
      email: citizen.email,
      nic: citizen.nic,
      phone: citizen.phone,
      address: citizen.address || '',
      dateOfBirth: citizen.dateOfBirth || '',
      gender: citizen.gender || 'male',
      preferredLanguage: citizen.preferredLanguage || 'english',
      emergencyContact: citizen.emergencyContact || '',
      occupation: citizen.occupation || ''
    });
    setIsEditModalOpen(true);
  };

  const handleAddCitizen = () => {
    setNewCitizen({
      name: '',
      email: '',
      nic: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: 'male',
      preferredLanguage: 'english',
      emergencyContact: '',
      occupation: ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveCitizen = () => {
    if (selectedCitizen) {
      // Update existing citizen
      setCitizens(prev =>
        prev.map(citizen =>
          citizen.id === selectedCitizen.id
            ? { ...citizen, ...newCitizen }
            : citizen
        )
      );
      setIsEditModalOpen(false);
    } else {
      // Add new citizen
      const newCitizenData: CitizenWithDetails = {
        ...newCitizen,
        id: `C${Date.now()}`,
        status: 'active',
        totalAppointments: 0,
        completedAppointments: 0,
        registrationDate: new Date().toISOString().split('T')[0],
        verificationStatus: 'verified',
        documentStatus: 'complete',
        averageRating: 0
      };
      setCitizens(prev => [...prev, newCitizenData]);
      setIsAddModalOpen(false);
    }
    setSelectedCitizen(null);
  };

  const handleStatusUpdate = (citizenId: string, newStatus: 'active' | 'inactive') => {
    setCitizens(prev =>
      prev.map(citizen =>
        citizen.id === citizenId
          ? { ...citizen, status: newStatus }
          : citizen
      )
    );
  };

  const exportCitizens = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting citizens...', filteredCitizens);
  };

  const columns = [
    {
      key: 'id',
      header: 'Citizen ID',
      render: (row: CitizenWithDetails) => (
        <div className="font-medium text-primary-600">{row.id}</div>
      )
    },
    {
      key: 'name',
      header: 'Citizen Details',
      render: (row: CitizenWithDetails) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
          <div className="text-sm text-gray-400">NIC: {row.nic}</div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (row: CitizenWithDetails) => (
        <div>
          <div className="flex items-center space-x-1">
            <Phone className="h-3 w-3 text-gray-400" />
            <span className="text-sm">{row.phone}</span>
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <Mail className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500 truncate">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: CitizenWithDetails) => (
        <div className="space-y-1">
          <span className={getStatusBadge(row.status)}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'totalAppointments',
      header: 'Activity',
      render: (row: CitizenWithDetails) => (
        <div className="text-sm">
          <div>{row.totalAppointments} appointments</div>
          <div className="text-gray-500">{row.completedAppointments} completed</div>
          {row.averageRating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs">{row.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'registrationDate',
      header: 'Registration',
      render: (row: CitizenWithDetails) => (
        <div className="text-sm">
          <div>{row.registrationDate}</div>
          {row.lastLoginDate && (
            <div className="text-gray-500">Last: {row.lastLoginDate}</div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: CitizenWithDetails) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewCitizen(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditCitizen(row)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citizen Management</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? "Manage all citizen profiles and account security system-wide" 
              : "View citizen profiles and history related to your department"
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={exportCitizens}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          {isAdmin && (
            <Button 
              onClick={handleAddCitizen}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Citizen</span>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Citizens"
          value={citizenStats.totalCitizens.toLocaleString()}
          icon={Users}
          trend="+12%"
          trendDirection="up"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, NIC, phone..."
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
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Citizens Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Citizens ({filteredCitizens.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            data={filteredCitizens}
            columns={columns}
          />
        </CardContent>
      </Card>

      {/* View Citizen Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Citizen Profile"
        size="xl"
      >
        {selectedCitizen && (
          <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedCitizen.name}</h3>
                <p className="text-gray-600">{selectedCitizen.id}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={getStatusBadge(selectedCitizen.status)}>
                  {selectedCitizen.status.charAt(0).toUpperCase() + selectedCitizen.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Personal Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">NIC Number</p>
                      <p className="text-sm text-gray-500">{selectedCitizen.nic}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Date of Birth</p>
                      <p className="text-sm text-gray-500">{selectedCitizen.dateOfBirth || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Gender</p>
                      <p className="text-sm text-gray-500 capitalize">{selectedCitizen.gender || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Occupation</p>
                      <p className="text-sm text-gray-500">{selectedCitizen.occupation || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-gray-500">{selectedCitizen.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-gray-500">{selectedCitizen.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Emergency Contact</p>
                      <p className="text-sm text-gray-500">{selectedCitizen.emergencyContact || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-gray-500">{selectedCitizen.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Account Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Appointments</p>
                  <p className="font-semibold text-gray-900">{selectedCitizen.totalAppointments}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="font-semibold text-gray-900">{selectedCitizen.completedAppointments}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="font-semibold text-gray-900">
                    {selectedCitizen.averageRating > 0 ? `${selectedCitizen.averageRating.toFixed(1)}/5.0` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="font-semibold text-gray-900">{selectedCitizen.lastLoginDate || 'Never'}</p>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="flex items-center space-x-3 pt-4 border-t">
                <Button
                  variant={selectedCitizen.status === 'active' ? 'danger' : 'primary'}
                  onClick={() => handleStatusUpdate(selectedCitizen.id, selectedCitizen.status === 'active' ? 'inactive' : 'active')}
                >
                  {selectedCitizen.status === 'active' ? 'Deactivate' : 'Activate'} Account
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Citizen Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedCitizen(null);
        }}
        title={selectedCitizen ? 'Edit Citizen' : 'Add New Citizen'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <Input
                value={newCitizen.name}
                onChange={(e) => setNewCitizen(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={newCitizen.email}
                onChange={(e) => setNewCitizen(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIC Number *
              </label>
              <Input
                value={newCitizen.nic}
                onChange={(e) => setNewCitizen(prev => ({ ...prev, nic: e.target.value }))}
                placeholder="Enter NIC number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <Input
                value={newCitizen.phone}
                onChange={(e) => setNewCitizen(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <Input
                type="date"
                value={newCitizen.dateOfBirth}
                onChange={(e) => setNewCitizen(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <Select
                value={newCitizen.gender}
                onChange={(value) => setNewCitizen(prev => ({ ...prev, gender: value }))}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Language
              </label>
              <Select
                value={newCitizen.preferredLanguage}
                onChange={(value) => setNewCitizen(prev => ({ ...prev, preferredLanguage: value }))}
                options={[
                  { value: 'english', label: 'English' },
                  { value: 'sinhala', label: 'Sinhala' },
                  { value: 'tamil', label: 'Tamil' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Occupation
              </label>
              <Input
                value={newCitizen.occupation}
                onChange={(e) => setNewCitizen(prev => ({ ...prev, occupation: e.target.value }))}
                placeholder="Enter occupation"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={newCitizen.address}
              onChange={(e) => setNewCitizen(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <Input
              value={newCitizen.emergencyContact}
              onChange={(e) => setNewCitizen(prev => ({ ...prev, emergencyContact: e.target.value }))}
              placeholder="Enter emergency contact number"
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button onClick={handleSaveCitizen}>
              {selectedCitizen ? 'Update Citizen' : 'Add Citizen'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedCitizen(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
