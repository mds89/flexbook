import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { toast } from 'sonner@2.0.3';
import { 
  Users, 
  User, 
  Search, 
  Filter,
  Award,
  Calendar,
  FileText,
  Plus,
  Edit,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  concessions: number;
  join_date: string;
  note_count?: number;
  last_booking?: string;
  total_bookings?: number;
  completed_classes?: number;
  cancelled_bookings?: number;
}

interface Note {
  id: number;
  user_id: number;
  content: string;
  category: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: number;
  user_id: number;
  class_id: number;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'late-cancelled';
  used_concession: boolean;
  booking_time: string;
  cancellation_time?: string;
  is_late_cancellation: boolean;
  class_name?: string;
  time?: string;
  instructor?: string;
  duration?: string;
}

const UserProfile: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const { getNotes } = useUser(); // Get getNotes function from UserContext
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [newNote, setNewNote] = useState({ content: '', category: 'general' });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newConcessions, setNewConcessions] = useState(user.concessions);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      // Load user notes
      const notesResponse = await api.getUserNotes(user.id);
      setNotes(notesResponse.notes || []);

      // Load user bookings (mock data for now)
      // In a real app, you'd have an API endpoint for user bookings
      setBookings([]);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      toast.error('Please enter note content');
      return;
    }

    try {
      await api.createNote(user.id, newNote.content, newNote.category);
      setNewNote({ content: '', category: 'general' });
      await loadUserData();
      // Also refresh the UserContext notes to update the global notes list
      await getNotes();
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Failed to add note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.content.trim()) return;

    try {
      await api.updateNote(editingNote.id, editingNote.content, editingNote.category);
      setEditingNote(null);
      await loadUserData();
      // Also refresh the UserContext notes to update the global notes list
      await getNotes();
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await api.deleteNote(noteId);
      await loadUserData();
      // Also refresh the UserContext notes to update the global notes list
      await getNotes();
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleUpdateConcessions = async () => {
    try {
      const concessionDifference = newConcessions - user.concessions;
      await api.updateUserConcessions(user.id, concessionDifference);
      toast.success('Concessions updated successfully');
      // Update local user data
      user.concessions = newConcessions;
    } catch (error) {
      console.error('Failed to update concessions:', error);
      toast.error('Failed to update concessions');
      setNewConcessions(user.concessions); // Reset to original value
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'medical': return 'bg-red-100 text-red-800';
      case 'behavioral': return 'bg-yellow-100 text-yellow-800';
      case 'preference': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {user.name}
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Joined: {formatDate(user.join_date)}</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {user.concessions} concessions remaining
                </span>
              </div>
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{user.total_bookings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All time bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Completed Classes</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{user.completed_classes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully attended
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Cancellation Rate</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">
                  {user.total_bookings ? 
                    Math.round(((user.cancelled_bookings || 0) / user.total_bookings) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Cancelled bookings
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-[15px]">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                {user.last_booking ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Last booking: {formatDate(user.last_booking)}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent bookings</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>
                View all bookings made by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3>No bookings found</h3>
                  <p className="text-muted-foreground">This user hasn't made any bookings yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Concession Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div>{booking.class_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {booking.time} - {booking.instructor}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(booking.booking_date)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            booking.status === 'completed' ? 'default' :
                            booking.status === 'confirmed' ? 'secondary' :
                            'destructive'
                          }>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.used_concession ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              <Award className="h-3 w-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-4">
            {/* Add Note Card */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note-category">Category</Label>
                  <Select value={newNote.category} onValueChange={(value) => 
                    setNewNote(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="preference">Preference</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-content">Note Content</Label>
                  <Textarea
                    id="note-content"
                    placeholder="Enter note content..."
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddNote}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </CardContent>
            </Card>

            {/* Notes List */}
            <Card>
              <CardHeader>
                <CardTitle>All Notes ({notes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3>No notes yet</h3>
                    <p className="text-muted-foreground">Add a note to keep track of important information.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getCategoryBadgeColor(note.category)}>
                            {note.category}
                          </Badge>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingNote(note)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {editingNote?.id === note.id ? (
                          <div className="space-y-2">
                            <Select 
                              value={editingNote.category} 
                              onValueChange={(value) => 
                                setEditingNote(prev => prev ? { ...prev, category: value } : null)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="medical">Medical</SelectItem>
                                <SelectItem value="behavioral">Behavioral</SelectItem>
                                <SelectItem value="preference">Preference</SelectItem>
                                <SelectItem value="financial">Financial</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              value={editingNote.content}
                              onChange={(e) => 
                                setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)
                              }
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateNote}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm mb-2">{note.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(note.created_at)}
                              {note.updated_at !== note.created_at && 
                                ` (updated ${formatDate(note.updated_at)})`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
              <CardDescription>
                Manage user account settings and concessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4>Concession Management</h4>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="concessions">New Concession Balance</Label>
                    <Input
                      id="concessions"
                      type="number"
                      value={newConcessions}
                      onChange={(e) => setNewConcessions(parseInt(e.target.value) || 0)}
                      className="w-32"
                    />
                  </div>
                  <Button onClick={handleUpdateConcessions} className="mt-6">
                    Update Concessions
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current: {user.concessions} concessions remaining
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4>Account Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="ml-2">{user.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <span className="ml-2">{user.role}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Join Date:</span>
                    <span className="ml-2">{formatDate(user.join_date)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notes Count:</span>
                    <span className="ml-2">{notes.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const UserManagement: React.FC = () => {
  const { users, isLoading, error, refreshUsers } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    refreshUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const totalConcessions = users.reduce((sum, user) => sum + user.concessions, 0);
  const avgConcessions = totalUsers > 0 ? Math.round(totalConcessions / totalUsers) : 0;

  if (selectedUser) {
    return <UserProfile user={selectedUser} onClose={() => setSelectedUser(null)} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={refreshUsers}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>User Management</h2>
        <p className="text-muted-foreground">
          Manage user accounts, view profiles, and track activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active user accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Concessions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalConcessions}</div>
            <p className="text-xs text-muted-foreground">
              Available across all users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Average Concessions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{avgConcessions}</div>
            <p className="text-xs text-muted-foreground">
              Per user average
            </p>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={(value: typeof roleFilter) => setRoleFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3>No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No users have been registered yet'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Concessions</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span className={user.concessions < 0 ? 'text-red-600' : user.concessions === 0 ? 'text-yellow-600' : 'text-green-600'}>
                              {user.concessions}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(user.join_date).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{user.note_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};