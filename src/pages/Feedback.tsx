import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Star,
  Search,
  Eye,
  BarChart3,
  Download,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Plus,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { StatCard } from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';
import { Feedback as FeedbackType, FeedbackStats, Appointment, Citizen, Document, Service } from '../types';
import { api } from '../utils/api';

interface FeedbackWithDerived extends FeedbackType {
  citizenName?: string;
  serviceName?: string;
  departmentName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  feedbackDate?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  isResolved?: boolean;
}

export const Feedback: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [feedback, setFeedback] = useState<FeedbackWithDerived[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackWithDerived[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithDerived | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FeedbackStats>({ 
    totalFeedback: 0, 
    averageRating: 0, 
    responseRate: 0,
    positiveFeedback: 0,
    positive: 0, 
    neutral: 0, 
    negative: 0 
  });
  const [appointmentDetails, setAppointmentDetails] = useState<Appointment | null>(null);
  const [citizenDetails, setCitizenDetails] = useState<Citizen | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  // New feedback form state
  const [newFeedback, setNewFeedback] = useState({
    appointmentId: '',
    rating: 5,
    remarks: ''
  });

  // Map backend feedback shape to UI requirements
  const deriveSentiment = (rating: number): 'positive' | 'neutral' | 'negative' => {
    if (rating >= 4) return 'positive';
    if (rating === 3) return 'neutral';
    return 'negative';
  };

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: feedbackList, error: err } = await api.getFeedback();
      if (err) {
        setError(err);
        setLoading(false);
        return;
      }

      const feedbackItems: FeedbackType[] = Array.isArray(feedbackList) ? feedbackList : [];

      const enrichedFeedbackPromises = feedbackItems.map(async (f) => {
        try {
          let citizenName = 'N/A';
          let serviceName = 'N/A';
          let departmentName = 'N/A';
          let appointmentDate: string | undefined;
          let appointmentTime: string | undefined;

          if (f.appointmentId) {
            const { data: appointment } = await api.getAppointmentById(f.appointmentId);

            if (appointment) {
              const dateObj = appointment.date_time ? new Date(appointment.date_time) : null;
              appointmentDate = dateObj ? dateObj.toISOString().split('T')[0] : undefined;
              appointmentTime = dateObj ? dateObj.toTimeString().split(' ')[0].substring(0, 5) : undefined;

              const citizenPromise = appointment.citizen_id ? api.getCitizenById(appointment.citizen_id) : Promise.resolve({ data: null });
              const servicePromise = appointment.service_id ? api.getServiceById(appointment.service_id) : Promise.resolve({ data: null });

              const [citizenResponse, serviceResponse] = await Promise.all([citizenPromise, servicePromise]);
              
              if (citizenResponse.data) {
                citizenName = (citizenResponse.data as Citizen).name || 'N/A';
              }
              
              if (serviceResponse.data) {
                const service = serviceResponse.data as Service;
                serviceName = service.serviceName || service.name || 'N/A';
                if (service.department) {
                    departmentName = service.department.name || 'N/A';
                }
              }
            }
          }
          
          return {
            ...f,
            citizenName,
            serviceName,
            departmentName,
            appointmentDate,
            appointmentTime,
            feedbackDate: f.createdAt || f.updatedAt,
            sentiment: deriveSentiment(f.rating || 0),
            isResolved: f.status === 'resolved',
          } as FeedbackWithDerived;

        } catch (error) {
          console.error(`Failed to enrich feedback ${f.id}:`, error);
          return {
            ...f,
            citizenName: 'Error loading',
            serviceName: 'Error loading',
            feedbackDate: f.createdAt || f.updatedAt,
            sentiment: deriveSentiment(f.rating || 0),
            isResolved: f.status === 'resolved',
          } as FeedbackWithDerived;
        }
      });

      const mapped = await Promise.all(enrichedFeedbackPromises);
      
      setFeedback(mapped);
      setFilteredFeedback(mapped);
    } catch (error) {
      console.error('Failed to load feedback:', error);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeedbackStats = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      const { data, error: err } = await api.getFeedbackStats();
      if (err) {
        console.warn('Failed to load feedback stats:', err);
        return;
      }
      
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.warn('Failed to load feedback stats:', error);
    }
  }, [isAdmin]);

  useEffect(() => { 
    loadFeedback();
    loadFeedbackStats();
  }, [loadFeedback, loadFeedbackStats]);

  // Filter feedback based on search and filters
  useEffect(() => {
    let filtered = feedback;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(fb =>
        (fb.citizenName || '').toLowerCase().includes(term) ||
        (fb.serviceName || '').toLowerCase().includes(term) ||
        (fb.departmentName || '').toLowerCase().includes(term) ||
        (fb.remarks || fb.comments || '').toLowerCase().includes(term)
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(fb => fb.rating === rating);
    }

    // Sentiment filter
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(fb => fb.sentiment === sentimentFilter);
    }

    // Department filter (for admin only)
    if (departmentFilter !== 'all' && isAdmin) {
      filtered = filtered.filter(fb => fb.departmentName === departmentFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      
      switch (dateFilter) {
        case 'today': {
          filtered = filtered.filter(fb => {
            const fbDateStr = fb.feedbackDate;
            if (!fbDateStr) return false;
            const fbDate = new Date(fbDateStr);
            return !isNaN(fbDate.getTime()) && fbDate.toDateString() === today.toDateString();
          });
          break;
        }
        case 'this_week': {
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          filtered = filtered.filter(fb => {
            const fbDateStr = fb.feedbackDate;
            if (!fbDateStr) return false;
            const fbDate = new Date(fbDateStr);
            return !isNaN(fbDate.getTime()) && fbDate >= oneWeekAgo && fbDate <= today;
          });
          break;
        }
        case 'this_month': {
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          filtered = filtered.filter(fb => {
            const fbDateStr = fb.feedbackDate;
            if (!fbDateStr) return false;
            const fbDate = new Date(fbDateStr);
            return !isNaN(fbDate.getTime()) && fbDate >= oneMonthAgo && fbDate <= today;
          });
          break;
        }
      }
    }

    setFilteredFeedback(filtered);
  }, [searchTerm, ratingFilter, sentimentFilter, departmentFilter, dateFilter, feedback, isAdmin]);

  const handleCreateFeedback = async () => {
    if (!newFeedback.appointmentId || !newFeedback.remarks.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const { error: err } = await api.createFeedback(newFeedback);
      if (err) {
        setError(err);
        return;
      }
      
      setIsCreateModalOpen(false);
      setNewFeedback({ appointmentId: '', rating: 5, remarks: '' });
      loadFeedback();
      loadFeedbackStats();
    } catch (error) {
      console.error('Failed to create feedback:', error);
      setError('Failed to create feedback');
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getSentimentBadge = (sentiment: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (sentiment) {
      case 'positive':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'neutral':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'negative':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'neutral':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleViewFeedback = async (feedback: FeedbackWithDerived) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
    setLoading(true);
    try {
      if (feedback.appointmentId) {
        const { data: appData, error: appError } = await api.getAppointmentById(feedback.appointmentId);
        if (appError) throw new Error(appError);
        setAppointmentDetails(appData);
  
        if (appData?.citizen_id) {
          const { data: citizenData, error: citizenError } = await api.getCitizenById(appData.citizen_id);
          if (citizenError) throw new Error(citizenError);
          setCitizenDetails(citizenData);
        }

        const { data: docData, error: docError } = await api.getDocumentsForAppointment(feedback.appointmentId);
        if(docError) throw new Error(docError);
        setDocuments(docData || []);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveFeedback = async (feedbackId: string) => {
    try {
      setLoading(true);
      // Assuming an API endpoint exists to update feedback status
      // await api.updateFeedbackStatus(feedbackId, 'resolved');
      console.log(`Feedback ${feedbackId} marked as resolved.`);
      // For now, we'll just update the local state
      setFeedback(prev => prev.map(f => f.id === feedbackId ? { ...f, isResolved: true } : f));
      loadFeedback(); // Reload to be sure
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to resolve feedback.');
    } finally {
      setLoading(false);
    }
  };

  const exportFeedback = () => {
    // Create CSV content
    const headers = ['Date', 'Citizen', 'Service', 'Department', 'Rating', 'Sentiment', 'Comments'];
    const csvContent = [
      headers.join(','),
      ...filteredFeedback.map(fb => [
        fb.feedbackDate || '',
        `"${fb.citizenName || ''}"`,
        `"${fb.serviceName || ''}"`,
        `"${fb.departmentName || ''}"`,
        fb.rating,
        fb.sentiment,
        `"${(fb.remarks || fb.comments || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'feedbackDate',
      header: 'Date',
      accessorKey: 'feedbackDate',
      cell: (row: FeedbackWithDerived) => (
        <div className="text-sm text-gray-500">
          {row.feedbackDate ? new Date(row.feedbackDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
        </div>
      )
    },
    {
      key: 'serviceName',
      header: 'Service & Department',
      accessorKey: 'serviceName',
      cell: (row: FeedbackWithDerived) => (
        <div>
          <div className="font-medium">{row.serviceName}</div>
          <div className="text-sm text-gray-500">{row.departmentName}</div>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Rating',
      accessorKey: 'rating',
      cell: (row: FeedbackWithDerived) => (
        <div className="flex items-center space-x-2">
          <div className="flex">{getRatingStars(row.rating)}</div>
          <span className="text-sm font-medium">{row.rating}/5</span>
        </div>
      )
    },
    {
      key: 'sentiment',
      header: 'Sentiment',
      accessorKey: 'sentiment',
      cell: (row: FeedbackWithDerived) => (
        <div className="flex items-center space-x-2">
          {getSentimentIcon(row.sentiment)}
          <span className={getSentimentBadge(row.sentiment)}>
            {row.sentiment.charAt(0).toUpperCase() + row.sentiment.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'remarks',
      header: 'Feedback',
      accessorKey: 'remarks',
      cell: (row: FeedbackWithDerived) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 truncate">
            {row.remarks || row.comments}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: FeedbackWithDerived) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewFeedback(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.sentiment === 'negative' && !row.isResolved && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => handleResolveFeedback(row.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          )}
        </div>
      )
    }
  ];

  const uniqueDepartments = [...new Set(feedback.map(f => f.departmentName).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600">
            {isAdmin 
              ? "Monitor citizen satisfaction across all departments" 
              : "Track feedback for your department services"
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={exportFeedback}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button 
            onClick={() => setIsAnalyticsModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          {user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Feedback</span>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Feedback" 
          value={stats.totalFeedback || feedback.length} 
          icon={MessageSquare} 
        />
        <StatCard 
          title="Average Rating" 
          value={`${stats.averageRating || 0}/5`} 
          icon={Star} 
        />
        <StatCard 
          title="Response Rate" 
          value={`${stats.responseRate || 0}%`} 
          icon={BarChart3} 
        />
        <StatCard 
          title="Positive Feedback" 
          value={`${stats.positiveFeedback || Math.round((stats.positive / (stats.totalFeedback || 1)) * 100)}%`} 
          icon={ThumbsUp} 
          color="green" 
        />
      </div>

      {/* Sentiment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Positive" value={stats.positive} icon={ThumbsUp} color="green" />
        <StatCard title="Neutral" value={stats.neutral} icon={AlertTriangle} color="orange" />
        <StatCard title="Negative" value={stats.negative} icon={ThumbsDown} color="red" />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter((e.target as HTMLSelectElement).value)}
                options={[
                  { value: 'all', label: 'All Ratings' },
                  { value: '5', label: '5 Stars' },
                  { value: '4', label: '4 Stars' },
                  { value: '3', label: '3 Stars' },
                  { value: '2', label: '2 Stars' },
                  { value: '1', label: '1 Star' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sentiment
              </label>
              <Select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter((e.target as HTMLSelectElement).value)}
                options={[
                  { value: 'all', label: 'All Sentiments' },
                  { value: 'positive', label: 'Positive' },
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'negative', label: 'Negative' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter((e.target as HTMLSelectElement).value)}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'this_week', label: 'This Week' },
                  { value: 'this_month', label: 'This Month' }
                ]}
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter((e.target as HTMLSelectElement).value)}
                  options={[
                    { value: 'all', label: 'All Departments' },
                    ...uniqueDepartments.map(dept => ({
                      value: dept!,
                      label: dept!
                    }))
                  ]}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Feedback ({filteredFeedback.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadFeedback();
                  loadFeedbackStats();
                }}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-4 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          <Table data={filteredFeedback} columns={columns} />
          {!loading && !error && !filteredFeedback.length && (
            <p className="text-sm text-gray-500 mt-4">No feedback found.</p>
          )}
          {loading && (
            <p className="text-sm text-gray-500 mt-4">Loading feedback...</p>
          )}
        </CardContent>
      </Card>

      {/* View Feedback Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Feedback Details"
        size="lg"
      >
        {selectedFeedback && (
          <div className="space-y-6">
            {loading && <p>Loading details...</p>}
            {error && <div className="p-3 mb-4 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
            {!loading && !error && (
              <>
                {/* Header with Rating */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{citizenDetails?.name || selectedFeedback.citizenName}</h3>
                    <p className="text-gray-600">{appointmentDetails?.service?.serviceName || selectedFeedback.serviceName}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex">{getRatingStars(selectedFeedback.rating)}</div>
                    <span className="text-lg font-bold">{selectedFeedback.rating}/5</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Citizen Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Citizen Details</h4>
                    {citizenDetails ? (
                      <div className="space-y-3 text-sm">
                        <p><strong>Name:</strong> {citizenDetails.name}</p>
                        <p><strong>Email:</strong> {citizenDetails.email}</p>
                        <p><strong>NIC:</strong> {citizenDetails.nic}</p>
                        <p><strong>Phone:</strong> {citizenDetails.phone}</p>
                      </div>
                    ) : <p>No citizen details available.</p>}
                  </div>

                  {/* Appointment Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Appointment Details</h4>
                    {appointmentDetails ? (
                      <div className="space-y-3 text-sm">
                        <p><strong>Date:</strong> {new Date(appointmentDetails.date_time).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {new Date(appointmentDetails.date_time).toLocaleTimeString()}</p>
                        <p><strong>Service:</strong> {appointmentDetails.service?.serviceName}</p>
                        <p><strong>Status:</strong> <span className="capitalize">{appointmentDetails.status}</span></p>
                        <p><strong>Reference:</strong> {appointmentDetails.reference_no}</p>
                      </div>
                    ) : <p>No appointment details available.</p>}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Submitted Documents</h4>
                  {documents.length > 0 ? (
                    <ul className="space-y-2">
                      {documents.map(doc => (
                        <li key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <span className="text-sm">{doc.document_name}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{doc.status}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-gray-500">No documents submitted for this appointment.</p>}
                </div>

                {/* Comments */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Comments</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedFeedback.remarks || selectedFeedback.comments}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Create Feedback Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewFeedback({ appointmentId: '', rating: 5, remarks: '' });
          setError(null);
        }}
        title="Submit Feedback"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment ID *
            </label>
            <Input
              placeholder="Enter appointment ID (e.g., APP1723532294023)"
              value={newFeedback.appointmentId}
              onChange={(e) => setNewFeedback(prev => ({ ...prev, appointmentId: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer ${
                    star <= newFeedback.rating 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                  onClick={() => setNewFeedback(prev => ({ ...prev, rating: star }))}
                />
              ))}
              <span className="text-sm text-gray-600">({newFeedback.rating}/5)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Share your experience with the service..."
              value={newFeedback.remarks}
              onChange={(e) => setNewFeedback(prev => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewFeedback({ appointmentId: '', rating: 5, remarks: '' });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFeedback} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        title="Feedback Analytics"
        size="xl"
      >
        <div className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Feedback</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalFeedback}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Average Rating</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.averageRating}/5</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Response Rate</p>
                  <p className="text-2xl font-bold text-green-900">{stats.responseRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Positive %</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.positiveFeedback}%</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Sentiment Distribution</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <ThumbsUp className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">{stats.positive}</p>
                <p className="text-sm text-green-600">Positive</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-900">{stats.neutral}</p>
                <p className="text-sm text-yellow-600">Neutral</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <ThumbsDown className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-900">{stats.negative}</p>
                <p className="text-sm text-red-600">Negative</p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Average rating: {stats.averageRating}/5</li>
              <li>• Response rate: {stats.responseRate}%</li>
              <li>• Positive feedback: {stats.positiveFeedback}%</li>
              <li>• Total feedback received: {stats.totalFeedback}</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};