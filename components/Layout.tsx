import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, Home, Calendar, Settings, User, BarChart3 } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t bg-card p-4">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>&copy; 2024 FlexBook. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // Redirect admins to admin dashboard if they try to access user pages
  if (user?.role === 'admin' && (location.pathname === '/dashboard' || location.pathname === '/book')) {
    navigate('/admin', { replace: true });
    return null;
  }

  // Redirect users to user dashboard if they try to access admin pages
  if (user?.role === 'user' && location.pathname === '/admin') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Link 
                to={user?.role === 'admin' ? '/admin' : '/dashboard'} 
                className="text-2xl font-bold text-primary"
              >
                FlexBook
              </Link>
              
              {user && (
                <nav className="hidden md:flex space-x-4">
                  {user.role === 'user' && (
                    <>
                      <Link
                        to="/dashboard"
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          location.pathname === '/dashboard'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      
                      <Link
                        to="/book"
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          location.pathname === '/book'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Book Classes</span>
                      </Link>
                    </>
                  )}
                  
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        location.pathname === '/admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </nav>
              )}
            </div>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {user.name} ({user.role === 'admin' ? 'Administrator' : 'Member'})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Sticky Footer */}
      <footer className="mt-auto border-t bg-card p-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 FlexBook. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};