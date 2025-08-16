import React, { useState, useEffect } from 'react';
import Layout from './Layout';

// Theme constants for direct hex values
const THEME_COLORS = {
  primary: {
    500: '#4C9B6F',
    600: '#1A5E3A',
  },
  secondary: {
    500: '#A8D4B9',
    600: '#569099',
    700: '#3F838E',
  },
  surface: {
    50: '#F5F6F9',
    100: '#F2F2F2',
    200: '#D9D9D9',
  }
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// API utility functions
class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async getCitizens(page = 1, limit = 50) {
    return this.request(`/citizens?page=${page}&limit=${limit}`);
  }

  static async getCitizenById(id) {
    return this.request(`/citizens/${id}`);
  }

  static async createCitizen(citizenData) {
    return this.request('/citizens', {
      method: 'POST',
      body: JSON.stringify(citizenData),
    });
  }

  static async updateCitizen(id, citizenData) {
    return this.request(`/citizens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(citizenData),
    });
  }

  static async deleteCitizen(id) {
    return this.request(`/citizens/${id}`, {
      method: 'DELETE',
    });
  }

  static async searchCitizens(query, filters = {}) {
    const params = new URLSearchParams({
      search: query,
      ...filters
    });
    return this.request(`/citizens/search?${params.toString()}`);
  }

  static async healthCheck() {
    return this.request('/health');
  }
}

const Citizens = () => {
  const [citizens, setCitizens] = useState([]);
  const [filteredCitizens, setFilteredCitizens] = useState([]);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    national_id: ''
  });

  // Load citizens on component mount
  useEffect(() => {
    loadCitizens();
  }, []);

  const loadCitizens = async (page = 1) => {
    try {
      setLoading(true);
      const response = await ApiService.getCitizens(page);
      
      let citizensData = [];
      if (Array.isArray(response)) {
        citizensData = response;
      } else if (response.data && Array.isArray(response.data)) {
        citizensData = response.data;
      } else if (response.citizens && Array.isArray(response.citizens)) {
        citizensData = response.citizens;
      }
      
      setCitizens(citizensData);
      setFilteredCitizens([...citizensData]);
    } catch (error) {
      console.error('Failed to load citizens:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockCitizens = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1-555-0123',
        address: '123 Main St, City, State 12345',
        date_of_birth: '1990-05-15',
        national_id: 'ID123456789',
        status: 'active',
        created_at: '2023-01-15T00:00:00Z'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+1-555-0124',
        address: '456 Oak Ave, City, State 12345',
        date_of_birth: '1985-09-22',
        national_id: 'ID987654321',
        status: 'active',
        created_at: '2023-02-20T00:00:00Z'
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@email.com',
        phone: '+1-555-0125',
        address: '789 Pine Rd, City, State 12345',
        date_of_birth: '1978-12-10',
        national_id: 'ID456789123',
        status: 'pending',
        created_at: '2023-12-01T00:00:00Z'
      }
    ];
    setCitizens(mockCitizens);
    setFilteredCitizens([...mockCitizens]);
  };

  const handleSearch = async (searchTerm) => {
    if (searchTerm.trim() === '') {
      setFilteredCitizens([...citizens]);
    } else {
      try {
        const results = await ApiService.searchCitizens(searchTerm);
        if (Array.isArray(results)) {
          setFilteredCitizens(results);
        } else if (results.data && Array.isArray(results.data)) {
          setFilteredCitizens(results.data);
        } else {
          throw new Error('Invalid search response format');
        }
      } catch (error) {
        console.warn('API search failed, using local search:', error);
        const filtered = citizens.filter(citizen =>
          (citizen.name && citizen.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (citizen.email && citizen.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (citizen.national_id && citizen.national_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (citizen.phone && citizen.phone.includes(searchTerm))
        );
        setFilteredCitizens(filtered);
      }
    }
  };

  const handleSearchInput = (searchTerm) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    setSearchTimeout(setTimeout(() => {
      handleSearch(searchTerm);
    }, 300));
  };

  const selectCitizen = (citizenId) => {
    const citizen = citizens.find(c => c.id === parseInt(citizenId));
    setSelectedCitizen(citizen);
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleAddCitizen = async (e) => {
    e.preventDefault();
    
    const { name, email, phone, address, national_id } = formData;
    
    if (!name || !email || !phone || !address || !national_id) {
      alert('Please fill in all required fields');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      const citizenData = {
        ...formData,
        status: 'active'
      };
      
      await ApiService.createCitizen(citizenData);
      await loadCitizens();
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        date_of_birth: '',
        national_id: ''
      });
      alert('Citizen added successfully');
    } catch (error) {
      console.error('Failed to add citizen:', error);
      alert('Failed to add citizen. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCitizen = async () => {
    if (!selectedCitizen) return;

    if (window.confirm(`Are you sure you want to delete ${selectedCitizen.name}?`)) {
      try {
        setLoading(true);
        await ApiService.deleteCitizen(selectedCitizen.id);
        await loadCitizens();
        setSelectedCitizen(null);
        alert('Citizen deleted successfully');
      } catch (error) {
        console.error('Failed to delete citizen:', error);
        alert('Failed to delete citizen. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const totalCount = citizens.length;
  const activeCount = citizens.filter(c => (c.status || 'active') === 'active').length;
  const pendingCount = citizens.filter(c => c.status === 'pending').length;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-slate-900">Government Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <span className="text-sm font-medium text-slate-700">Admin User</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <h2 className="text-lg font-semibold text-slate-900">Navigation</h2>
            </div>
            <nav className="mt-2 flex-1 px-3 space-y-1">
              <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                Dashboard
              </a>
              <a href="#" className="bg-green-50 border-r-2 border-green-500 text-green-700 group flex items-center px-3 py-2 text-sm font-semibold rounded-lg">
                <svg className="text-green-500 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Citizens
              </a>
              <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Services
              </a>
              <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Reports
              </a>
              <a href="#" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Settings
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            {/* Page header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
                <div className="py-6 md:flex md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div>
                        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:leading-9 sm:truncate">
                          Citizens Management
                        </h1>
                        <p className="mt-2 flex items-center text-sm text-slate-500 font-medium">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Government Portal
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                    <button 
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Citizen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8 py-8">
              {/* Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">Total Citizens</dt>
                        <dd className="text-2xl font-bold text-slate-900">{totalCount}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">Active Citizens</dt>
                        <dd className="text-2xl font-bold text-slate-900">{activeCount}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">Pending</dt>
                        <dd className="text-2xl font-bold text-slate-900">{pendingCount}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-slate-500 truncate">New This Month</dt>
                        <dd className="text-2xl font-bold text-slate-900">24</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="bg-white shadow-sm rounded-2xl border border-gray-200 mb-8">
                <div className="p-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search citizens by name, email, or ID..."
                      onChange={(e) => handleSearchInput(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Citizens Grid */}
              <div className="bg-white shadow-sm rounded-2xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-semibold text-slate-900">All Citizens</h3>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">Manage and view detailed citizen information</p>
                </div>
                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCitizens.length === 0 ? (
                      <div className="col-span-full">
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <h3 className="font-semibold mb-2">No citizens found</h3>
                          <p className="text-gray-600">Try adjusting your search terms or add a new citizen.</p>
                        </div>
                      </div>
                    ) : (
                      filteredCitizens.map(citizen => (
                        <div 
                          key={citizen.id}
                          className={`bg-white border-2 rounded-2xl transition-all cursor-pointer p-6 hover:border-green-500 hover:shadow-lg ${
                            selectedCitizen?.id === citizen.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}
                          onClick={() => selectCitizen(citizen.id)}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {(citizen.name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 truncate">
                                  {citizen.name || 'Unknown'}
                                </h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusClasses(citizen.status)}`}>
                                  {citizen.status || 'active'}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-slate-600">
                                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {citizen.email || 'No email'}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {citizen.phone || 'No phone'}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                  </svg>
                                  ID: {citizen.national_id || citizen.id}
                                </div>
                              </div>
                              <div className="mt-3 text-xs text-slate-500">
                                Registered: {formatDate(citizen.created_at || citizen.registration_date)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Citizen Details Panel */}
              {selectedCitizen && (
                <div className="mt-8 bg-white shadow-sm rounded-2xl border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-semibold text-slate-900">Citizen Details</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">Detailed information for {selectedCitizen.name}</p>
                  </div>
                  <div className="px-6 py-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-900">Full Name</label>
                          <p className="text-sm text-slate-600">{selectedCitizen.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-900">Email Address</label>
                          <p className="text-sm text-slate-600">{selectedCitizen.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-900">Phone Number</label>
                          <p className="text-sm text-slate-600">{selectedCitizen.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-900">Address</label>
                          <p className="text-sm text-slate-600">{selectedCitizen.address || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-900">National ID</label>
                          <p className="text-sm text-slate-600">{selectedCitizen.national_id || selectedCitizen.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-900">Date of Birth</label>
                          <p className="text-sm text-slate-600">{formatDate(selectedCitizen.date_of_birth) || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-900">Registration Date</label>
                          <p className="text-sm text-slate-600">{formatDate(selectedCitizen.created_at || selectedCitizen.registration_date)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-900">Status</label>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses(selectedCitizen.status)}`}>
                              {selectedCitizen.status || 'active'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex space-x-3">
                      <button 
                        onClick={() => alert(`Edit functionality for ${selectedCitizen.name} would open here`)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        onClick={() => alert(`History view for ${selectedCitizen.name} would open here`)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View History
                      </button>
                      <button 
                        onClick={handleDeleteCitizen}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Add Citizen Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center min-h-screen px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">Add New Citizen</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddCitizen} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <textarea 
                  required 
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  placeholder="Enter full address"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                  <input 
                    type="date" 
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">National ID</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.national_id}
                    onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="ID Number"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-slate-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Citizen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Citizens;