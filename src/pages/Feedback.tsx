import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Target
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

interface FeedbackWithDetails extends FeedbackType {
  citizenName: string;
  serviceName: string;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  feedbackDate: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Mock feedback data
const mockFeedback: FeedbackWithDetails[] = [
  {
    id: 'FB-001',
    appointment_id: 'APT-001',
    rating: 5,
    comments: 'Excellent service! The passport application process was smooth and the officer was very helpful. No waiting time and all documents were processed efficiently.',
    citizenName: 'Kasun Perera',
    serviceName: 'Passport Application',
    departmentName: 'Immigration & Emigration',
    appointmentDate: '2024-01-15',
    appointmentTime: '09:00 AM',
    feedbackDate: '2024-01-15',
    sentiment: 'positive'
  },
  {
    id: 'FB-002',
    appointment_id: 'APT-002',
    rating: 4,
    comments: 'Good service overall. The process was clear and the staff was professional. Only minor delay but within acceptable limits.',
    citizenName: 'Amara Fernando',
    serviceName: 'Birth Certificate',
    departmentName: 'Registrar General',
    appointmentDate: '2024-01-15',
    appointmentTime: '10:30 AM',
    feedbackDate: '2024-01-15',
    sentiment: 'positive'
  },
  {
    id: 'FB-003',
    appointment_id: 'APT-003',
    rating: 3,
    comments: 'Average experience. The service was okay but there was some confusion about the required documents initially.',
    citizenName: 'Priya Jayawardena',
    serviceName: 'License Renewal',
    departmentName: 'Motor Traffic',
    appointmentDate: '2024-01-14',
    appointmentTime: '02:00 PM',
    feedbackDate: '2024-01-14',
    sentiment: 'neutral'
  },
  {
    id: 'FB-004',
    appointment_id: 'APT-004',
    rating: 2,
    comments: 'Not satisfied with the service. Had to wait longer than expected and the process was not clearly explained.',
    citizenName: 'Ruwan Dissanayake',
    serviceName: 'Tax Registration',
    departmentName: 'Inland Revenue',
    appointmentDate: '2024-01-16',
    appointmentTime: '11:00 AM',
    feedbackDate: '2024-01-16',
    sentiment: 'negative'
  },
  {
    id: 'FB-005',
    appointment_id: 'APT-005',
    rating: 1,
    comments: 'Very poor service. The officer was not available at the scheduled time and no proper explanation was given.',
    citizenName: 'Lakshmi Rajapakse',
    serviceName: 'Income Certificate',
    departmentName: 'Grama Niladhari',
    appointmentDate: '2024-01-14',
    appointmentTime: '04:30 PM',
    feedbackDate: '2024-01-14',
    sentiment: 'negative'
  }
];

// Feedback statistics
const feedbackStats = {
  totalFeedback: 1456,
  averageRating: 4.1,
  positiveFeedback: 892,
  neutralFeedback: 324,
  negativeFeedback: 240,
  responseRate: 87.3,
  satisfactionTrend: '+12%',
  mostRatedService: 'Passport Application',
  departmentRatings: [
    { department: 'Immigration & Emigration', rating: 4.5, count: 324 },
    { department: 'Motor Traffic', rating: 4.2, count: 298 },
    { department: 'Registrar General', rating: 4.0, count: 267 },
    { department: 'Inland Revenue', rating: 3.8, count: 234 },
    { department: 'Grama Niladhari', rating: 3.9, count: 189 }
  ]
};

export const Feedback: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  
  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>(mockFeedback);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackWithDetails[]>(mockFeedback);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithDetails | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // Filter feedback based on search and filters
  useEffect(() => {
    let filtered = feedback;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(fb =>
        fb.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fb.comments.toLowerCase().includes(searchTerm.toLowerCase())
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
            const fbDate = new Date(fb.feedbackDate);
            return fbDate.toDateString() === today.toDateString();
          });
          break;
        }
        case 'this_week': {
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          filtered = filtered.filter(fb => {
            const fbDate = new Date(fb.feedbackDate);
            return fbDate >= oneWeekAgo && fbDate <= today;
          });
          break;
        }
        case 'this_month': {
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          filtered = filtered.filter(fb => {
            const fbDate = new Date(fb.feedbackDate);
            return fbDate >= oneMonthAgo && fbDate <= today;
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

  const handleViewFeedback = (feedback: FeedbackWithDetails) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };

  const exportFeedback = () => {
    // In a real app, this would generate and download a CSV/Excel file
    console.log('Exporting feedback data...', filteredFeedback);
  };

  const columns = [
    {
      header: 'Citizen',
      accessorKey: 'citizenName',
      cell: (row: FeedbackWithDetails) => (
        <div>
          <div className="font-medium">{row.citizenName}</div>
          <div className="text-sm text-gray-500">{row.feedbackDate}</div>
        </div>
      )
    },
    {
      header: 'Service',
      accessorKey: 'serviceName',
      cell: (row: FeedbackWithDetails) => (
        <div>
          <div className="font-medium">{row.serviceName}</div>
          <div className="text-sm text-gray-500">{row.departmentName}</div>
        </div>
      )
    },
    {
      header: 'Rating',
      accessorKey: 'rating',
      cell: (row: FeedbackWithDetails) => (
        <div className="flex items-center space-x-2">
          <div className="flex">{getRatingStars(row.rating)}</div>
          <span className="text-sm font-medium">{row.rating}/5</span>
        </div>
      )
    },
    {
      header: 'Sentiment',
      accessorKey: 'sentiment',
      cell: (row: FeedbackWithDetails) => (
        <div className="flex items-center space-x-2">
          {getSentimentIcon(row.sentiment)}
          <span className={getSentimentBadge(row.sentiment)}>
            {row.sentiment.charAt(0).toUpperCase() + row.sentiment.slice(1)}
          </span>
        </div>
      )
    },
    {
      header: 'Comments',
      accessorKey: 'comments',
      cell: (row: FeedbackWithDetails) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 truncate">{row.comments}</p>
        </div>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: FeedbackWithDetails) => (
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
        <StatCard
          title="Total Feedback"
          value={feedbackStats.totalFeedback.toLocaleString()}
          icon={MessageSquare}
          trend="+15%"
          trendDirection="up"
        />
        <StatCard
          title="Average Rating"
          value={`${feedbackStats.averageRating}/5`}
          icon={Star}
          trend={feedbackStats.satisfactionTrend}
          trendDirection="up"
        />
        <StatCard
          title="Response Rate"
          value={`${feedbackStats.responseRate}%`}
          icon={Target}
          trend="+5%"
          trendDirection="up"
        />
        <StatCard
          title="Positive Feedback"
          value={`${Math.round((feedbackStats.positiveFeedback / feedbackStats.totalFeedback) * 100)}%`}
          icon={ThumbsUp}
          trend="+8%"
          trendDirection="up"
        />
      </div>

      {/* Sentiment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Positive"
          value={feedbackStats.positiveFeedback.toString()}
          icon={ThumbsUp}
          trend="+12%"
          trendDirection="up"
          className="border-green-200 bg-green-50"
        />
        <StatCard
          title="Neutral"
          value={feedbackStats.neutralFeedback.toString()}
          icon={AlertTriangle}
          trend="+3%"
          trendDirection="up"
          className="border-yellow-200 bg-yellow-50"
        />
        <StatCard
          title="Negative"
          value={feedbackStats.negativeFeedback.toString()}
          icon={ThumbsDown}
          trend="-18%"
          trendDirection="down"
          className="border-red-200 bg-red-50"
        />
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
                onChange={setRatingFilter}
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
                onChange={setSentimentFilter}
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
                onChange={setDateFilter}
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
                  onChange={setDepartmentFilter}
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
            data={filteredFeedback}
            columns={columns}
          />
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
              {feedbackStats.departmentRatings.map((dept, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{dept.department}</p>
                    <p className="text-sm text-gray-500">{dept.count} feedback entries</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">{getRatingStars(Math.round(dept.rating))}</div>
                    <span className="font-semibold">{dept.rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Insights</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Overall satisfaction improved by 12% this month</li>
              <li>• Immigration & Emigration has the highest rating (4.5/5)</li>
              <li>• Most common positive feedback: "Quick service and professional staff"</li>
              <li>• Main improvement area: "Clear communication about document requirements"</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
