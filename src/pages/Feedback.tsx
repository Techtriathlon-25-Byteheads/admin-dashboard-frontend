import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Star,
  Search,
  Eye,
  Calendar,
  User,
  Building2,
  BarChart3,
  Download,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { StatCard } from '../components/ui/StatCard';
import { useAuthStore } from '../store/authStore';
import { Feedback as FeedbackType } from '../types';
import { api } from '../utils/api';

interface FeedbackWithDerived extends FeedbackType {
  citizenName?: string;
  serviceName?: string;
  departmentName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  feedbackDate?: string; // fallback using createdAt if provided by API in future
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Local statistics derived from current dataset
interface LocalFeedbackStats {
  total: number;
  averageRating: number;
  positive: number;
  neutral: number;
  negative: number;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LocalFeedbackStats>({ total: 0, averageRating: 0, positive: 0, neutral: 0, negative: 0 });

  // Map backend feedback shape (currently unspecified in API docs) to UI requirements.
  const deriveSentiment = (rating: number): 'positive' | 'neutral' | 'negative' => {
    if (rating >= 4) return 'positive';
    if (rating === 3) return 'neutral';
    return 'negative';
  };

  const computeStats = useCallback((items: FeedbackWithDerived[]): LocalFeedbackStats => {
    if (!items.length) return { total: 0, averageRating: 0, positive: 0, neutral: 0, negative: 0 };
    const total = items.length;
    const sum = items.reduce((acc, f) => acc + (f.rating || 0), 0);
    const positive = items.filter(f => f.sentiment === 'positive').length;
    const neutral = items.filter(f => f.sentiment === 'neutral').length;
    const negative = items.filter(f => f.sentiment === 'negative').length;
    return { total, averageRating: parseFloat((sum / total).toFixed(2)), positive, neutral, negative };
  }, []);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.getFeedback();
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }
    // Assume data is an array; enrich with derived fields.
    // Define minimal backend feedback shape to avoid pervasive any usage.
  interface BackendCitizen { fullName?: string; name?: string; }
  interface BackendDepartment { name?: string; }
  interface BackendService { serviceName?: string; name?: string; department?: BackendDepartment; }
  interface BackendAppointment { appointmentDate?: string; appointmentTime?: string; date_time?: string; citizen?: BackendCitizen; service?: BackendService; }
  interface BackendFeedback { id: string; appointment_id: string; rating: number; comments: string; appointment?: BackendAppointment; createdAt?: string; updatedAt?: string; }
    const arr: BackendFeedback[] = Array.isArray(data) ? (data as BackendFeedback[]) : [];
    const mapped: FeedbackWithDerived[] = arr.map((f: BackendFeedback) => {
  const appointment: BackendAppointment = f.appointment || {};
  const service: BackendService = appointment.service || {};
  const department: BackendDepartment = service.department || {};
      const appointmentDateISO: string = appointment.appointmentDate || appointment.date_time || '';
      const appointmentTimeISO: string = appointment.appointmentTime || '';
      const dateObj = appointmentDateISO ? new Date(appointmentDateISO) : null;
      const timeObj = appointmentTimeISO ? new Date(appointmentTimeISO) : null;
      return {
        ...f,
        citizenName: appointment.citizen?.fullName || appointment.citizen?.name || 'Citizen',
        serviceName: service.serviceName || service.name || 'Service',
        departmentName: department.name || 'Department',
        appointmentDate: dateObj ? dateObj.toISOString().split('T')[0] : undefined,
        appointmentTime: timeObj ? timeObj.toISOString().split('T')[1]?.substring(0, 5) : undefined,
        feedbackDate: f.createdAt || f.updatedAt,
        sentiment: deriveSentiment(f.rating || 0),
      } as FeedbackWithDerived;
    });
    setFeedback(mapped);
    setFilteredFeedback(mapped);
    setStats(computeStats(mapped));
    setLoading(false);
  }, [computeStats]);

  useEffect(() => { loadFeedback(); }, [loadFeedback]);

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
        (fb.comments || '').toLowerCase().includes(term)
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

  const handleViewFeedback = (feedback: FeedbackWithDerived) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };

  const exportFeedback = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting feedback data...', filteredFeedback);
  };

  const columns = [
    {
      key: 'citizenName',
      header: 'Citizen',
      accessorKey: 'citizenName',
      cell: (row: FeedbackWithDerived) => (
        <div>
          <div className="font-medium">{row.citizenName}</div>
          <div className="text-sm text-gray-500">{row.feedbackDate}</div>
        </div>
      )
    },
    {
      key: 'serviceName',
      header: 'Service',
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
      key: 'comments',
      header: 'Comments',
      accessorKey: 'comments',
      cell: (row: FeedbackWithDerived) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 truncate">{row.comments}</p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: FeedbackWithDerived) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewFeedback(row)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

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
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Feedback" value={stats.total} icon={MessageSquare} />
        <StatCard title="Average Rating" value={`${stats.averageRating}/5`} icon={Star} />
        <StatCard title="Positive" value={stats.positive} icon={ThumbsUp} color="green" />
        <StatCard title="Negative" value={stats.negative} icon={ThumbsDown} color="red" />
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
                    { value: 'Immigration & Emigration', label: 'Immigration & Emigration' },
                    { value: 'Registrar General', label: 'Registrar General' },
                    { value: 'Motor Traffic', label: 'Motor Traffic' },
                    { value: 'Inland Revenue', label: 'Inland Revenue' },
                    { value: 'Grama Niladhari', label: 'Grama Niladhari' }
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
                onClick={() => loadFeedback()}
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
            {/* Header with Rating */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedFeedback.citizenName}</h3>
                <p className="text-gray-600">{selectedFeedback.serviceName}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex">{getRatingStars(selectedFeedback.rating)}</div>
                <span className="text-lg font-bold">{selectedFeedback.rating}/5</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointment Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Appointment Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedFeedback.appointmentDate}</p>
                      <p className="text-sm text-gray-500">{selectedFeedback.appointmentTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{selectedFeedback.departmentName}</p>
                      <p className="text-sm text-gray-500">{selectedFeedback.serviceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedFeedback.citizenName}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Analysis */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Feedback Analysis</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getSentimentIcon(selectedFeedback.sentiment)}
                    <div>
                      <p className="font-medium">Sentiment</p>
                      <span className={getSentimentBadge(selectedFeedback.sentiment)}>
                        {selectedFeedback.sentiment.charAt(0).toUpperCase() + selectedFeedback.sentiment.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Feedback Date</p>
                      <p className="text-sm text-gray-500">{selectedFeedback.feedbackDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Comments</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">{selectedFeedback.comments}</p>
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Action Items</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Follow up with department for service improvement</li>
                <li>• Share positive feedback with service team</li>
                <li>• Track trend analysis for continuous improvement</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        title="Feedback Analytics"
        size="xl"
      >
        <div className="space-y-6">
          {/* Department Ratings */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Department Performance</h4>
            <div className="space-y-3">
              {/* Placeholder: would display department aggregated ratings when backend analytics available */}
              <p className="text-sm text-gray-500">Department performance analytics not available yet.</p>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Insights</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Average rating: {stats.averageRating}/5</li>
              <li>• Positive share: {stats.total ? Math.round((stats.positive / stats.total) * 100) : 0}%</li>
              <li>• Neutral share: {stats.total ? Math.round((stats.neutral / stats.total) * 100) : 0}%</li>
              <li>• Negative share: {stats.total ? Math.round((stats.negative / stats.total) * 100) : 0}%</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
