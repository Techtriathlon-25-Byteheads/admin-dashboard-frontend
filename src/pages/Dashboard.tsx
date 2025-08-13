import React, { useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Building2, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

const mockAnalytics = {
  totalAppointments: 1245,
  totalDepartments: 12,
  totalOfficers: 48,
  totalCitizens: 2891,
  averageWaitTime: 25,
  satisfactionScore: 4.2,
  noShowRate: 8.5,
  peakHours: [
    { hour: '09:00', count: 120 },
    { hour: '10:00', count: 180 },
    { hour: '11:00', count: 220 },
    { hour: '12:00', count: 160 },
    { hour: '13:00', count: 90 },
    { hour: '14:00', count: 200 },
    { hour: '15:00', count: 170 },
    { hour: '16:00', count: 140 },
  ],
  departmentLoad: [
    { department: 'Immigration', count: 245 },
    { department: 'Health', count: 198 },
    { department: 'Education', count: 176 },
    { department: 'Transport', count: 142 },
    { department: 'Revenue', count: 118 },
  ],
  processingTimes: [
    { date: '2024-01-01', avgTime: 28 },
    { date: '2024-01-02', avgTime: 32 },
    { date: '2024-01-03', avgTime: 25 },
    { date: '2024-01-04', avgTime: 30 },
    { date: '2024-01-05', avgTime: 22 },
    { date: '2024-01-06', avgTime: 26 },
    { date: '2024-01-07', avgTime: 24 },
  ],
};

const COLORS = ['#4C9B6F', '#569099', '#A8D4B9', '#3F838E', '#1A5E3A'];

export const Dashboard: React.FC = () => {
  const { analytics, setAnalytics, setLoading } = useAppStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Mock data loading
    setLoading(true);
    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, [setAnalytics, setLoading]);

  const isAdmin = user?.role === 'admin';

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9B6F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A5E3A]">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.name}. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Appointments"
          value={analytics.totalAppointments.toLocaleString()}
          icon={Calendar}
          change={{ value: 12, type: 'increase' }}
        />
        
        {isAdmin && (
          <StatCard
            title="Active Departments"
            value={analytics.totalDepartments}
            icon={Building2}
            change={{ value: 2, type: 'increase' }}
            color="blue"
          />
        )}

        <StatCard
          title={isAdmin ? "Total Officers" : "My Appointments"}
          value={isAdmin ? analytics.totalOfficers : 23}
          icon={Users}
          change={{ value: 5, type: 'increase' }}
          color="orange"
        />

        <StatCard
          title="Avg Wait Time"
          value={`${analytics.averageWaitTime} min`}
          icon={Clock}
          change={{ value: 3, type: 'decrease' }}
          color="green"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours Today</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4C9B6F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Processing Times */}
        <Card>
          <CardHeader>
            <CardTitle>Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.processingTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgTime" stroke="#4C9B6F" strokeWidth={2} />
              </LineChart>
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
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#569099" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Completed Today</span>
                </div>
                <span className="font-semibold">89</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold">23</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">No Shows</span>
                </div>
                <span className="font-semibold">8</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-[#4C9B6F]" />
                  <span className="text-sm">Satisfaction</span>
                </div>
                <span className="font-semibold">{analytics.satisfactionScore}/5</span>
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
              {[
                { time: '09:00 AM', citizen: 'John Doe', service: 'Passport Application', status: 'completed' },
                { time: '10:30 AM', citizen: 'Jane Smith', service: 'License Renewal', status: 'in-progress' },
                { time: '11:15 AM', citizen: 'Mike Johnson', service: 'Certificate Request', status: 'pending' },
                { time: '02:00 PM', citizen: 'Sarah Wilson', service: 'Tax Filing', status: 'pending' },
              ].map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">{appointment.time}</div>
                    <div className="text-sm text-gray-600">{appointment.citizen}</div>
                    <div className="text-sm text-gray-500">{appointment.service}</div>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status.replace('-', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};