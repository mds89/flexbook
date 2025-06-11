import React, { useState } from 'react';
import { useClass } from '../contexts/ClassContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  Users, 
  User,
  FileText,
  Eye,
  Filter,
  Search,
  CalendarClock,
  CalendarDays,
  Timer,
  DollarSign
,
  DollarSign
} from 'lucide-react';

interface GymClass {
  id: number;
  name: string;
  time: string;
  duration: string;
  instructor: string;
  max_capacity: number;
  description: string;
  category: 'morning' | 'afternoon';
  days: string[];
  status: 'published' | 'draft' | 'scheduled';
  publish_date?: string;
  start_date?: string;
  end_date?: string;
  price?: number;
  drop_in_price?: number;
  created_at: string;
  updated_at: string;
}

interface ClassFormData {
  name: string;
  time: string;
  duration: string;
  instructor: string;
  max_capacity: number;
  description: string;
  category: 'morning' | 'afternoon';
  days: string[];
  status: 'published' | 'draft' | 'scheduled';
  publish_date?: string;
  start_date?: string;
  end_date?: string;
  price?: number;
  drop_in_price?: number;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper function to format date for display
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Not set';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
};

// Helper function to format price
const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return 'Free';
  return `$${price.toFixed(2)}`;
};

// Helper function to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const ClassForm: React.FC<{
  initialData?: Partial<ClassFormData>;
  onSubmit: (data: ClassFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}> = ({ initialData, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState<ClassFormData>({
    name: initialData?.name || '',
    time: initialData?.time || '',
    duration: initialData?.duration || '',
    instructor: initialData?.instructor || '',
    max_capacity: initialData?.max_capacity || 20,
    description: initialData?.description || '',
    category: initialData?.category || 'morning',
    days: initialData?.days || [],
    status: initialData?.status || 'draft',
    publish_date: initialData?.publish_date || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    price: initialData?.price || 0,
    drop_in_price: initialData?.drop_in_price || 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleStatusChange = (status: 'published' | 'draft' | 'scheduled') => {
    setFormData(prev => ({
      ...prev,
      status,
      // Auto-set publish date to today if switching to published
      publish_date: status === 'published' ? getTodayString() : prev.publish_date,
      // Clear scheduling dates if switching to draft
      ...(status === 'draft' && {
        publish_date: '',
        start_date: '',
        end_date: ''
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.time || !formData.instructor || formData.days.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validation for scheduled classes
    if (formData.status === 'scheduled') {
      if (!formData.publish_date) {
        toast.error('Please set a publish date for scheduled classes');
        return;
      }
      if (!formData.start_date) {
        toast.error('Please set a start date for scheduled classes');
        return;
      }
      if (formData.publish_date > formData.start_date) {
        toast.error('Publish date cannot be after start date');
        return;
      }
      if (formData.end_date && formData.start_date > formData.end_date) {
        toast.error('Start date cannot be after end date');
        return;
      }
    }

    // Price validation
    if (formData.price !== undefined && formData.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }
    if (formData.drop_in_price !== undefined && formData.drop_in_price < 0) {
      toast.error('Drop-in price cannot be negative');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success(isEdit ? 'Class updated successfully' : 'Class created successfully');
      onCancel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSchedulingFields = formData.status === 'scheduled' || formData.status === 'published';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Class Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Morning Yoga"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor">Instructor *</Label>
          <Input
            id="instructor"
            value={formData.instructor}
            onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
            placeholder="e.g., Sarah Johnson"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            placeholder="e.g., 60 minutes"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_capacity">Max Capacity</Label>
          <Input
            id="max_capacity"
            type="number"
            min="1"
            value={formData.max_capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: parseInt(e.target.value) || 20 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value: 'morning' | 'afternoon') => 
            setFormData(prev => ({ ...prev, category: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Class Pricing (NZD)
          </CardTitle>
          <CardDescription>
            Set the pricing for this class. Leave at $0 for free classes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Standard Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Price when booking with concessions/membership
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drop_in_price">Drop-in Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="drop_in_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.drop_in_price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, drop_in_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Price for single-session bookings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Days of Week *</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={formData.days.includes(day)}
                onCheckedChange={() => handleDayToggle(day)}
              />
              <Label htmlFor={day} className="text-sm">{day}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the class..."
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Publication Status</Label>
          <Select value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Save as Draft</SelectItem>
              <SelectItem value="published">Publish Immediately</SelectItem>
              <SelectItem value="scheduled">Schedule for Later</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scheduling Fields */}
        {showSchedulingFields && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Class Schedule
              </CardTitle>
              <CardDescription>
                Set when this class becomes available for booking and when it physically starts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publish_date" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Publish Date {formData.status === 'scheduled' && '*'}
                  </Label>
                  <Input
                    id="publish_date"
                    type="date"
                    value={formData.publish_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                    min={getTodayString()}
                    required={formData.status === 'scheduled'}
                  />
                  <p className="text-sm text-muted-foreground">
                    When users can start booking this class
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Start Date {formData.status === 'scheduled' && '*'}
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required={formData.status === 'scheduled'}
                  />
                  <p className="text-sm text-muted-foreground">
                    When the class physically starts
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  End Date (Optional)
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  min={formData.start_date || getTodayString()}
                />
                <p className="text-sm text-muted-foreground">
                  When the class ends (leave empty for ongoing classes)
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (isEdit ? 'Update Class' : 'Create Class')}
        </Button>
      </div>
    </form>
  );
};

export const ClassManagement: React.FC = () => {
  const { classes, isLoading, error, createClass, updateClass, deleteClass, clearError } = useClass();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<GymClass | null>(null);

  // Clear error when component mounts
  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const filteredClasses = classes.filter(gymClass => {
    const matchesSearch = gymClass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gymClass.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gymClass.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || gymClass.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreate = async (data: ClassFormData) => {
    await createClass(data);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async (data: ClassFormData) => {
    if (editingClass) {
      await updateClass(editingClass.id, data);
      setEditingClass(null);
    }
  };

  const handleDelete = async (classId: number) => {
    try {
      await deleteClass(classId);
      toast.success('Class deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete class');
    }
  };

  const getStatusBadge = (gymClass: GymClass) => {
    switch (gymClass.status) {
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Eye className="h-3 w-3 mr-1" />
            Published
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <CalendarClock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };

  const getScheduleInfo = (gymClass: GymClass) => {
    if (gymClass.status === 'draft') {
      return <span className="text-muted-foreground">No schedule set</span>;
    }

    const parts = [];
    
    if (gymClass.publish_date) {
      parts.push(`Available: ${formatDate(gymClass.publish_date)}`);
    }
    
    if (gymClass.start_date) {
      parts.push(`Starts: ${formatDate(gymClass.start_date)}`);
    }
    
    if (gymClass.end_date) {
      parts.push(`Ends: ${formatDate(gymClass.end_date)}`);
    }

    return parts.length > 0 ? (
      <div className="text-sm space-y-1">
        {parts.map((part, index) => (
          <div key={index} className="text-muted-foreground">{part}</div>
        ))}
      </div>
    ) : (
      <span className="text-muted-foreground">No dates set</span>
    );
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={clearError}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2>Class Management</h2>
          <p className="text-muted-foreground">
            Manage your fitness classes, schedules, pricing, and availability
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new fitness class to your schedule. You can save it as a draft, publish it immediately, or schedule it for later.
              </DialogDescription>
            </DialogHeader>
            <ClassForm
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Classes</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={categoryFilter} onValueChange={(value: typeof categoryFilter) => setCategoryFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Classes ({filteredClasses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3>No classes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first class'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Class
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Details</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((gymClass) => (
                    <TableRow key={gymClass.id}>
                      <TableCell>
                        <div>
                          <div>{gymClass.name}</div>
                          <div className="text-sm text-muted-foreground">{gymClass.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {gymClass.instructor}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {gymClass.time} ({gymClass.duration})
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {gymClass.days.join(', ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatPrice(gymClass.price)}</span>
                          </div>
                          {gymClass.drop_in_price !== undefined && gymClass.drop_in_price !== gymClass.price && (
                            <div className="text-sm text-muted-foreground">
                              Drop-in: {formatPrice(gymClass.drop_in_price)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getScheduleInfo(gymClass)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {gymClass.max_capacity}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(gymClass)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingClass(gymClass)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{gymClass.name}"? This action cannot be undone.
                                  {gymClass.status === 'published' && (
                                    <div className="mt-2 text-amber-600">
                                      ⚠️ This class is currently published and may have active bookings.
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(gymClass.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Class
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Make changes to "{editingClass?.name}". You can update any aspect of the class including its schedule and pricing.
            </DialogDescription>
          </DialogHeader>
          {editingClass && (
            <ClassForm
              initialData={editingClass}
              onSubmit={handleUpdate}
              onCancel={() => setEditingClass(null)}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};