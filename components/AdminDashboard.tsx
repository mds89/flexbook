import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Activity,
  User,
  Settings
} from 'lucide-react';
import { ClassManagement } from './ClassManagement';
import { UserManagement } from './UserManagement';
import { PaymentManagementModal } from './PaymentManagement';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, allBookings, classes } = useBooking();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load users data
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.getAllUsers();
        setUsers(response.users);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Calculate real analytics from booking data
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay());
  
  const currentWeekBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.booking_date);
    return bookingDate >= currentWeekStart && bookingDate <= now;
  });

  const completedBookings = allBookings.filter(booking => booking.status === 'completed');
  const confirmedBookings = allBookings.filter(booking => booking.status === 'confirmed');
  const totalActiveBookings = confirmedBookings.length + completedBookings.length;

  // Weekly data based on actual bookings
  const weeklyData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
    const dayBookings = currentWeekBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate.getDay() === index;
    });
    
    // Calculate revenue based on concessions used (assume $8 per concession)
    const revenue = dayBookings.filter(b => b.used_concession).length * 8;
    
    return {
      name: day,
      bookings: dayBookings.length,
      revenue: revenue
    };
  });

  // Class popularity data based on actual bookings
  const classPopularity = classes.map(gymClass => {
    const classBookings = allBookings.filter(booking => booking.class_id === gymClass.id);
    return {
      name: gymClass.name,
      value: classBookings.length,
      color: `hsl(${gymClass.id * 137.5 % 360}, 70%, 50%)`
    };
  }).filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Top 6 classes

  // Monthly trends (simulate based on available data)
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    // Simulate growth trend
    const baseBookings = 80 + (i * 5) + (Math.random() * 20 - 10);
    const concessionRevenue = baseBookings * 0.8 * 8; // 80% use concessions, $8 each
    
    return {
      month: monthName,
      members: Math.max(users.length - 10 + i, users.length),
      bookings: Math.round(baseBookings),
      revenue: Math.round(concessionRevenue)
    };
  });

  // Calculate metrics
  const totalMembers = users.length;
  const weeklyBookingsCount = currentWeekBookings.length;
  const weeklyRevenue = currentWeekBookings.filter(b => b.used_concession).length * 8;
  const attendanceRate = totalActiveBookings > 0 ? Math.round((completedBookings.length / totalActiveBookings) * 100) : 0;

  // Recent activity from actual bookings
  const recentActivity = allBookings
    .sort((a, b) => new Date(b.booking_time).getTime() - new Date(a.booking_time).getTime())
    .slice(0, 5)
    .map(booking => {
      const gymClass = classes.find(c => c.id === booking.class_id);
      const user = users.find(u => u.id === booking.user_id);
      
      let action = '';
      if (booking.status === 'confirmed') {
        action = `Booked ${gymClass?.name || 'Unknown Class'}`;
      } else if (booking.status === 'completed') {
        action = `Completed ${gymClass?.name || 'Unknown Class'}`;
      } else if (booking.status === 'cancelled') {
        action = `Cancelled ${gymClass?.name || 'Unknown Class'}`;
      } else if (booking.status === 'late-cancelled') {
        action = `Late cancelled ${gymClass?.name || 'Unknown Class'}`;
      }

      const timeDiff = now.getTime() - new Date(booking.booking_time).getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      const hoursAgo = Math.floor(minutesAgo / 60);
      const daysAgo = Math.floor(hoursAgo / 24);

      let timeString = '';
      if (daysAgo > 0) {
        timeString = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
      } else if (hoursAgo > 0) {
        timeString = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
      } else {
        timeString = `${Math.max(1, minutesAgo)} minute${minutesAgo > 1 ? 's' : ''} ago`;
      }

      return {
        user: user?.name || 'Unknown User',
        action,
        time: timeString,
        type: booking.status
      };
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your gym operations and monitor performance
          </p>
        </div>
        
        {/* Admin Account Info and Settings */}
        <div className="flex gap-4">
          <PaymentManagementModal />
          
          <Card className="sm:w-auto w-full">
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <p className="font-medium">Account Details</p>
                <p className="text-muted-foreground">Email: {user?.email}</p>
                <p className="text-muted-foreground">Role: {user?.role}</p>
                <Badge variant="outline" className="w-fit">Administrator</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Active gym members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyBookingsCount}</div>
                <p className="text-xs text-muted-foreground">
                  This week's bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${weeklyRevenue}</div>
                <p className="text-xs text-muted-foreground">
                  From concession usage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Classes completed vs booked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Bookings Overview</CardTitle>
                <CardDescription>
                  Daily bookings and estimated revenue for this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#8884d8" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Popularity</CardTitle>
                <CardDescription>
                  Most booked classes by total bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {classPopularity.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={classPopularity}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {classPopularity.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No booking data available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest member activities and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          activity.type === 'confirmed' ? 'bg-green-500' :
                          activity.type === 'completed' ? 'bg-blue-500' :
                          activity.type === 'cancelled' ? 'bg-gray-500' :
                          activity.type === 'late-cancelled' ? 'bg-red-500' :
                          'bg-primary'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium">{activity.user}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Management Tab */}
        <TabsContent value="classes">
          <ClassManagement />
        </TabsContent>

        {/* Users Management Tab */}
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>
                Track key metrics over the past 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="members" stroke="#8884d8" name="Members" />
                    <Line type="monotone" dataKey="bookings" stroke="#82ca9d" name="Bookings" />
                    <Line type="monotone" dataKey="revenue" stroke="#ffc658" name="Revenue ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Classes Offered</span>
                  <span className="font-semibold">{classes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Bookings per Class</span>
                  <span className="font-semibold">
                    {classes.length > 0 ? Math.round(allBookings.length / classes.length * 10) / 10 : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Most Popular Day</span>
                  <span className="font-semibold">
                    {weeklyData.reduce((max, day) => day.bookings > max.bookings ? day : max, weeklyData[0])?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cancellation Rate</span>
                  <span className="font-semibold">
                    {allBookings.length > 0 ? 
                      Math.round((allBookings.filter(b => b.status.includes('cancelled')).length / allBookings.length) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>
                  Revenue sources and concession usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Concession Usage</span>
                    <span className="font-semibold">
                      ${allBookings.filter(b => b.used_concession).length * 8}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Late Cancellation Fees</span>
                    <span className="font-semibold">
                      ${allBookings.filter(b => b.status === 'late-cancelled').length * 8}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-sm">Total Revenue</span>
                    <span>
                      ${(allBookings.filter(b => b.used_concession).length + 
                         allBookings.filter(b => b.status === 'late-cancelled').length) * 8}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};