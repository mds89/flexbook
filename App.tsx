import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { UserProvider } from './contexts/UserContext';
import { ClassProvider } from './contexts/ClassContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { UserDashboard } from './components/UserDashboard';
import { BookingPage } from './components/BookingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Toaster } from './components/ui/sonner';

// Protected Route Component with role-based access
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  adminOnly?: boolean;
  userOnly?: boolean;
}> = ({ children, adminOnly = false, userOnly = false }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only routes
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // User-only routes (admins can't access user features like booking)
  if (userOnly && user.role !== 'user') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    // Redirect based on role
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

// Smart Dashboard Route - redirects based on user role
const DashboardRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <UserDashboard />;
  }
};

function AppContent() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <ErrorBoundary>
            <Routes>
              {/* Root redirect based on authentication */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <ErrorBoundary>
                      <LoginPage />
                    </ErrorBoundary>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <ErrorBoundary>
                      <RegisterPage />
                    </ErrorBoundary>
                  </PublicRoute>
                } 
              />

              {/* Smart Dashboard Route */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <DashboardRoute />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />

              {/* User-Only Routes */}
              <Route 
                path="/book" 
                element={
                  <ProtectedRoute userOnly>
                    <ErrorBoundary>
                      <BookingPage />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />

              {/* Admin-Only Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly>
                    <ErrorBoundary>
                      <AdminDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ErrorBoundary>
        </Layout>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ErrorBoundary>
          <UserProvider>
            <ErrorBoundary>
              <ClassProvider>
                <ErrorBoundary>
                  <BookingProvider>
                    <AppContent />
                  </BookingProvider>
                </ErrorBoundary>
              </ClassProvider>
            </ErrorBoundary>
          </UserProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ErrorBoundary>
  );
}