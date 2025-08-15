import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  Building2, 
  Clock, 
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import { Analytics, Appointment } from '../types';
import { PRIMARY_COLOR, SECONDARY_ACCENT } from '../constants/theme';

export const Dashboard: React.FC = () => {
  const { analytics, setAnalytics, setLoading, appointments, setAppointments } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch analytics data
        const analyticsResponse = await api.getAnalytics();
        if (analyticsResponse.error) {
          setError(analyticsResponse.error);
        } else if (analyticsResponse.data) {
          setAnalytics(analyticsResponse.data as Analytics);
        }

        // Fetch appointments for officers or admin
        if (user?.role) {
          const appointmentsResponse = await api.getAdminAppointments();
          if (appointmentsResponse.data) {
            setAppointments(appointmentsResponse.data as Appointment[]);
          }
        }
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [setAnalytics, setLoading, setAppointments, user?.role]);

  const isAdmin = user?.role === 'SUPER_ADMIN';
  
  // Filter today's appointments for officers
  const todaysAppointments = appointments?.filter(appointment => {
    const appointmentDate = new Date(appointment.date_time);
    const today = new Date();
    return appointmentDate.toDateString() === today.toDateString();
  }).slice(0, 4) || []; // Show only first 4

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading dashboard data:</p>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-600">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName || user?.name || 'Admin'}. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Appointments"
          value={analytics.appointmentStats.totalThisMonth.toLocaleString()}
          icon={Calendar}
          change={{ 
            value: Math.abs(analytics.appointmentStats.percentageChange), 
            type: analytics.appointmentStats.percentageChange >= 0 ? 'increase' : 'decrease' 
          }}
        />
        
        {isAdmin && (
          <StatCard
            title="Active Services"
            value={analytics.activeServiceStats.totalThisMonth}
            icon={Building2}
            change={{ 
              value: Math.abs(analytics.activeServiceStats.percentageChange), 
              type: analytics.activeServiceStats.percentageChange >= 0 ? 'increase' : 'decrease' 
            }}
            color="blue"
          />
        )}

        <StatCard
          title={isAdmin ? "Total Officers" : "My Department"}
          value={isAdmin ? analytics.officerStats.totalOfficers : "Active"}
          icon={Users}
          change={isAdmin ? { 
            value: Math.abs(analytics.officerStats.percentageChange), 
            type: analytics.officerStats.percentageChange >= 0 ? 'increase' : 'decrease' 
          } : { value: 0, type: 'increase' }}
          color="orange"
        />

        <StatCard
          title="Today's Status"
          value={analytics.quickStatsToday.completed}
          icon={CheckCircle}
          change={{ value: 0, type: 'increase' }}
          color="green"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours Today</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.peakHoursToday}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Load */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Department Load Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.departmentLoad}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={SECONDARY_ACCENT} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Completed Today</span>
                </div>
                <span className="font-semibold">{analytics.quickStatsToday.completed}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold">{analytics.quickStatsToday.pending}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">No Shows</span>
                </div>
                <span className="font-semibold">{analytics.quickStatsToday.noShows}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary-500" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <span className="font-semibold">{analytics.quickStatsToday.cancelled}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity for Officers */}
      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysAppointments.length > 0 ? todaysAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(appointment.date_time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-sm text-gray-600">{appointment.citizen?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{appointment.service?.name || 'Unknown Service'}</div>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status.replace('-', ' ')}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};