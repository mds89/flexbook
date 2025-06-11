import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Calendar, Clock, User, Plus, ChevronRight, Award, X, CreditCard, AlertTriangle, DollarSign, Banknote, Building } from 'lucide-react';
import { toast } from 'sonner';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings, classes, cancelBooking } = useBooking();

  // Use bookings directly from context instead of getUserBookings function
  const userBookings = bookings.filter(booking => booking.user_id === user?.id) || [];
  const upcomingBookings = userBookings
    .filter(booking => new Date(booking.booking_date) >= new Date() && booking.status === 'confirmed')
    .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
    .slice(0, 3);

  const recentActivity = userBookings
    .sort((a, b) => new Date(b.booking_time).getTime() - new Date(a.booking_time).getTime())
    .slice(0, 5);

  const getClassDetails = (classId: number) => {
    return classes.find(c => c.id === classId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      const result = await cancelBooking(bookingId);
      console.log('Cancellation result:', result);
      
      if (result.isLateCancellation) {
        toast.error(result.message);
      } else {
        // Show success message with concession refund info
        if (result.concessionRefunded) {
          toast.success(result.message + ' Your concession balance has been updated.');
        } else {
          toast.success(result.message);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    }
  };

  const isWithin24Hours = (classDate: string, classTime: string): boolean => {
    const now = new Date();
    const classDateTime = new Date(`${classDate}T${classTime}:00`);
    const timeDifference = classDateTime.getTime() - now.getTime();
    const hoursUntilClass = timeDifference / (1000 * 60 * 60);
    
    return hoursUntilClass <= 24 && hoursUntilClass > 0;
  };

  const getConcessionStatus = () => {
    const concessions = user?.concessions || 0;
    if (concessions < 0) {
      return {
        status: 'negative',
        message: `You're using ${Math.abs(concessions)} credit${Math.abs(concessions) > 1 ? 's' : ''}`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else if (concessions === 0) {
      return {
        status: 'zero',
        message: 'No concessions available',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    } else {
      return {
        status: 'positive',
        message: `${concessions} concession${concessions > 1 ? 's' : ''} available`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
  };

  const concessionStatus = getConcessionStatus();
  const canBook = (user?.concessions || 0) > -5; // Allow booking down to -5
  const nearLimit = (user?.concessions || 0) <= -3;
  const needsPayment = (user?.concessions || 0) <= 0;

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground">
              Ready for your next workout? Here's what's coming up.
            </p>
            {user?.role === 'admin' && (
              <Badge variant="outline" className="w-fit">
                Administrator Account
              </Badge>
            )}
          </div>
          
          {/* Account Info */}
          <Card className="sm:w-auto w-full">
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <p className="font-medium">Account Details</p>
                <p className="text-muted-foreground">Email: {user?.email}</p>
                <p className="text-muted-foreground">Role: {user?.role}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Concession Status Alert */}
        {(user?.concessions || 0) < 0 && (
          <Card className={`${concessionStatus.bgColor} ${concessionStatus.borderColor} border-2`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${concessionStatus.color}`} />
                <div className="flex-1">
                  <p className={`font-medium ${concessionStatus.color}`}>
                    Credit Balance: {Math.abs(user?.concessions || 0)} concession{Math.abs(user?.concessions || 0) > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nearLimit 
                      ? `You're close to the credit limit. Please make a payment soon.`
                      : `You have ${5 + (user?.concessions || 0)} more booking${5 + (user?.concessions || 0) > 1 ? 's' : ''} available on credit.`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concession Balance</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${concessionStatus.color}`}>
                {user?.concessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {concessionStatus.message}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userBookings.length}</div>
              <p className="text-xs text-muted-foreground">
                All time bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings.length}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Classes</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userBookings.filter(b => b.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Classes finished
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Information - Always visible for users */}
        {needsPayment && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
              <CardDescription className="text-blue-700">
                Top up your concessions to continue booking classes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="bank-transfer" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bank-transfer" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Bank Transfer
                  </TabsTrigger>
                  <TabsTrigger value="cash" className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash Payment
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="bank-transfer" className="mt-4">
                  <div className="bg-white p-4 rounded-lg border space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Bank:</span>
                        <div>ANZ New Zealand</div>
                      </div>
                      <div>
                        <span className="font-medium">Account:</span>
                        <div>FlexGym Ltd</div>
                      </div>
                      <div>
                        <span className="font-medium">Account Number:</span>
                        <div>01-0123-0123456-00</div>
                      </div>
                    </div>
                    <div className="text-sm border-t pt-2">
                      <span className="font-medium">Reference:</span>
                      <div className="text-muted-foreground">Please use your full name and email address</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="cash" className="mt-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Pay at Reception</p>
                        <p className="text-xs text-muted-foreground">Contact gym staff to arrange payment</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Quick Action */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump into your fitness routine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1" disabled={!canBook}>
                <Link to="/book">
                  <Plus className="mr-2 h-4 w-4" />
                  Book a Class
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/book">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule
                </Link>
              </Button>
              {user?.role === 'admin' && (
                <Button variant="secondary" asChild className="flex-1">
                  <Link to="/admin">
                    <User className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </Button>
              )}
            </div>
            {!canBook && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">
                  You have reached the credit limit. Please make a payment to continue booking classes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Classes</CardTitle>
              <CardDescription>
                Your next scheduled workouts
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/book">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const classDetails = getClassDetails(booking.class_id);
                  const isLateCancel = classDetails ? isWithin24Hours(booking.booking_date, classDetails.time) : false;
                  
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="font-medium">{classDetails?.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(booking.booking_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {classDetails?.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {classDetails?.instructor}
                          </div>
                        </div>
                        {booking.used_concession && (
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-lilac text-white border-lilac"
                          >
                            <Award className="mr-1 h-3 w-3" />
                            Used Concession
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {isLateCancel && (
                          <span className="text-xs text-destructive">
                            Late cancel
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No upcoming classes</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book your first class to get started!
                </p>
                <Button className="mt-4" asChild disabled={!canBook}>
                  <Link to="/book">Book Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your booking history and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((booking) => {
                  const classDetails = getClassDetails(booking.class_id);
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">{classDetails?.name}</h4>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(booking.booking_date)} at {classDetails?.time}
                        </div>
                        {booking.is_late_cancellation && (
                          <p className="text-xs text-destructive">
                            Late cancellation - concession charged
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            booking.status === 'confirmed' ? 'default' : 
                            booking.status === 'completed' ? 'secondary' :
                            booking.status === 'late-cancelled' ? 'destructive' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {booking.status === 'late-cancelled' ? 'Late Cancelled' : booking.status}
                        </Badge>
                        {booking.used_concession && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Award className="h-3 w-3 cursor-help text-lilac" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Concession Used</p>
                                <p className="text-xs text-muted-foreground">
                                  {booking.status === 'completed' 
                                    ? 'A concession was deducted for attending this class.'
                                    : booking.status === 'late-cancelled'
                                    ? 'A concession was forfeited as a late cancellation penalty (you cancelled within 24 hours of the class start time).'
                                    : 'A concession was used for this booking.'
                                  }
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No booking activity yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Demo Instructions */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Demo Instructions</CardTitle>
            <CardDescription>
              Testing the FlexGym booking system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <p><strong>Current Account:</strong> {user?.email} ({user?.role})</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <p><strong>Concessions:</strong> You have {user?.concessions || 0} concessions available</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <p><strong>Credit System:</strong> You can book up to 5 classes on credit when you have 0 concessions (going to -5)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <p><strong>Cancellation Policy:</strong> Cancel within 24 hours and you'll still be charged a concession</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <p><strong>Payment Information:</strong> Shown above when you need to top up concessions</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <p><strong>To test different accounts:</strong> Use the "Switch Account" button above or logout from the menu</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                <p><strong>Demo accounts:</strong> admin@gym.com / admin123 and user@gym.com / user123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};