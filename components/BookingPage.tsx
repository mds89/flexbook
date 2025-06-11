import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Award,
  AlertTriangle,
  X,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const { classes, bookClass, bookings, getClassBookings, cancelBooking, isLoading } = useBooking();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<string>('book');

  // Use bookings directly from context instead of getUserBookings function
  const userBookings = bookings.filter(booking => booking.user_id === user?.id) || [];

  // Get next 14 days for booking (extended from 7)
  const getNext14Days = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const next14Days = getNext14Days();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      full: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    };
  };

  const getDayOfWeek = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const isClassAvailableOnDate = (gymClass: any, date: string) => {
    const dayOfWeek = getDayOfWeek(date);
    return gymClass.days.includes(dayOfWeek);
  };

  const isAlreadyBooked = (classId: number, date: string) => {
    return userBookings.some(
      b => b.class_id === classId && b.booking_date === date && b.status === 'confirmed'
    );
  };

  const getClassCapacity = async (classId: number, date: string) => {
    try {
      const classBookings = await getClassBookings(classId, date);
      const gymClass = classes.find(c => c.id === classId);
      return {
        current: classBookings.length,
        max: gymClass?.max_capacity || 0
      };
    } catch (error) {
      console.error('Failed to get class capacity:', error);
      return { current: 0, max: 0 };
    }
  };

  const isWithin24Hours = (classDate: string, classTime: string): boolean => {
    const now = new Date();
    const classDateTime = new Date(`${classDate}T${classTime}:00`);
    const timeDifference = classDateTime.getTime() - now.getTime();
    const hoursUntilClass = timeDifference / (1000 * 60 * 60);
    
    return hoursUntilClass <= 24 && hoursUntilClass > 0;
  };

  const handleBookClass = async (classId: number) => {
    if (!user) {
      toast.error('Please log in to book a class');
      return;
    }

    // Allow booking if concessions are greater than -5 (credit limit)
    if ((user.concessions || 0) < -5) {
      toast.error('You have reached the credit limit. Please make a payment to continue booking classes.');
      return;
    }
    
    try {
      await bookClass(classId, selectedDate);
      toast.success('Class booked successfully! A concession has been deducted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to book class');
    }
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

  const handleBookFirstClass = () => {
    setActiveTab('book');
  };

  const availableClasses = classes.filter(c => isClassAvailableOnDate(c, selectedDate));
  const morningClasses = availableClasses.filter(c => c.category === 'morning');
  const afternoonClasses = availableClasses.filter(c => c.category === 'afternoon');

  const upcomingBookings = userBookings
    .filter(b => new Date(b.booking_date) >= new Date() && b.status === 'confirmed')
    .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

  // Check if user can book classes (not at credit limit)
  const canBook = (user?.concessions || 0) > -5;
  const isOnCredit = (user?.concessions || 0) < 0;
  const creditsUsed = Math.abs(Math.min(user?.concessions || 0, 0));
  const creditsRemaining = 5 - creditsUsed;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Book a Class</h1>
            <p className="text-muted-foreground">
              Choose your workout and secure your spot
            </p>
          </div>
          
          {/* Concession Info */}
          <Card className="sm:w-auto w-full">
            <CardContent className="pt-4">
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-medium">Concession Balance</span>
                </div>
                <div className={`text-2xl font-bold ${
                  (user?.concessions || 0) < 0 ? 'text-red-600' : 
                  (user?.concessions || 0) === 0 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {user?.concessions || 0}
                </div>
                {isOnCredit && (
                  <div className="space-y-1">
                    <p className="text-xs text-red-600">
                      Using {creditsUsed} credit{creditsUsed > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {creditsRemaining} more booking{creditsRemaining > 1 ? 's' : ''} available on credit
                    </p>
                  </div>
                )}
                {!canBook && (
                  <p className="text-xs text-destructive">
                    Credit limit reached - payment required
                  </p>
                )}
                {(user?.concessions || 0) >= 0 && (
                  <p className="text-xs text-muted-foreground">
                    {(user?.concessions || 0) === 0 ? 'No concessions - can book 5 on credit' : 'Concessions available'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="book">Book Classes</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
        </TabsList>

        {/* Book Classes Tab */}
        <TabsContent value="book" className="space-y-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>
                Choose the date you'd like to book a class (next 14 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {next14Days.map(date => {
                  const dateInfo = formatDate(date);
                  const isSelected = date === selectedDate;
                  const isToday = date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <Button
                      key={date}
                      variant={isSelected ? 'default' : 'outline'}
                      className="flex flex-col p-3 h-auto"
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className="text-xs">{dateInfo.day}</span>
                      <span className="text-lg font-bold">{dateInfo.date}</span>
                      {isToday && <span className="text-xs">Today</span>}
                    </Button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Selected: {formatDate(selectedDate).full}
              </p>
            </CardContent>
          </Card>

          {/* Morning Classes */}
          {morningClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Morning Classes</CardTitle>
                <CardDescription>
                  Start your day with energy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {morningClasses.map(gymClass => {
                    const isBooked = isAlreadyBooked(gymClass.id, selectedDate);
                    const userCanBook = !isBooked && user && canBook;
                    
                    return (
                      <div key={gymClass.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{gymClass.name}</h3>
                            <Badge variant="outline">{gymClass.category}</Badge>
                            {isBooked && (
                              <Badge variant="default">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Booked
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {gymClass.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {gymClass.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {gymClass.instructor}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {gymClass.max_capacity} spots
                            </div>
                          </div>
                          <p className="text-sm">{gymClass.description}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            onClick={() => handleBookClass(gymClass.id)}
                            disabled={!userCanBook || isLoading}
                            variant={isBooked ? 'outline' : 'default'}
                          >
                            {isLoading ? 'Booking...' :
                             isBooked ? 'Booked' : 
                             !canBook ? 'Credit Limit Reached' :
                             'Book Class'}
                          </Button>
                          
                          {userCanBook && (
                            <p className="text-xs text-muted-foreground">
                              Uses 1 concession
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Afternoon Classes */}
          {afternoonClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Afternoon Classes</CardTitle>
                <CardDescription>
                  Wind down with evening fitness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {afternoonClasses.map(gymClass => {
                    const isBooked = isAlreadyBooked(gymClass.id, selectedDate);
                    const userCanBook = !isBooked && user && canBook;
                    
                    return (
                      <div key={gymClass.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{gymClass.name}</h3>
                            <Badge variant="outline">{gymClass.category}</Badge>
                            {isBooked && (
                              <Badge variant="default">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Booked
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {gymClass.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {gymClass.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {gymClass.instructor}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {gymClass.max_capacity} spots
                            </div>
                          </div>
                          <p className="text-sm">{gymClass.description}</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            onClick={() => handleBookClass(gymClass.id)}
                            disabled={!userCanBook || isLoading}
                            variant={isBooked ? 'outline' : 'default'}
                          >
                            {isLoading ? 'Booking...' :
                             isBooked ? 'Booked' : 
                             !canBook ? 'Credit Limit Reached' :
                             'Book Class'}
                          </Button>
                          
                          {userCanBook && (
                            <p className="text-xs text-muted-foreground">
                              Uses 1 concession
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Classes Available */}
          {availableClasses.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No classes available</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  There are no classes scheduled for {formatDate(selectedDate).full}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Classes are available on Mondays, Wednesdays, and Fridays
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* My Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Upcoming Bookings</CardTitle>
              <CardDescription>
                Manage your scheduled classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBookings.map(booking => {
                    const classDetails = classes.find(c => c.id === booking.class_id);
                    const isLateCancel = classDetails ? isWithin24Hours(booking.booking_date, classDetails.time) : false;
                    
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{classDetails?.name}</h4>
                            <Badge variant="default">Confirmed</Badge>
                            {booking.used_concession && (
                              <Badge 
                                variant="outline"
                                style={{
                                  backgroundColor: 'var(--lilac)',
                                  color: 'var(--lilac-foreground)',
                                  borderColor: 'var(--lilac)'
                                }}
                              >
                                <Award className="mr-1 h-3 w-3" />
                                Concession Used
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(booking.booking_date).full}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {classDetails?.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {classDetails?.instructor}
                            </div>
                          </div>
                          {isLateCancel && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Late cancellation: You'll still be charged a concession</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">No upcoming bookings</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Book a class to see it here
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={handleBookFirstClass}
                    disabled={!canBook}
                  >
                    Book Your First Class
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Information for users on credit */}
          {isOnCredit && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">Credit Balance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Current Credit:</strong> You are using {creditsUsed} credit{creditsUsed > 1 ? 's' : ''} (balance: {user?.concessions})</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Remaining Credit:</strong> You can book {creditsRemaining} more class{creditsRemaining > 1 ? 'es' : ''} on credit</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Payment:</strong> Please make a payment to continue booking after reaching the credit limit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Policy */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Free Cancellation:</strong> Cancel more than 24 hours before class and get your concession refunded</p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p><strong>Late Cancellation:</strong> Cancel within 24 hours and you'll still be charged a concession</p>
                </div>
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p><strong>Credit System:</strong> You can book up to 5 classes on credit when you have 0 concessions (going to -5)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};