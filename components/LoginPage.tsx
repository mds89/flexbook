import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import config from '../config/environment';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const fillDemoCredentials = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setFormData({
        email: 'admin@gym.com',
        password: 'admin123'
      });
    } else {
      setFormData({
        email: 'user@gym.com',
        password: 'user123'
      });
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-secondary/30">
      <div className="w-full max-w-md space-y-6">
        {/* Development Mode Notice */}
        {config.FEATURES.USE_MOCK_API && config.IS_DEVELOPMENT && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Development Mode</strong> - Using mock API with demo accounts
            </AlertDescription>
          </Alert>
        )}

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to FlexBook</CardTitle>
            <p className="text-muted-foreground">
              Professional gym class booking system
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Demo Account Buttons - Show in development or when using mock API */}
            {config.FEATURES.USE_MOCK_API && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Demo Accounts
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoCredentials('admin')}
                      className="text-xs"
                    >
                      Admin Demo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillDemoCredentials('user')}
                      className="text-xs"
                    >
                      User Demo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Admin: Full management access • User: Booking and account management
                  </p>
                </div>
              </>
            )}

            <Separator className="my-4" />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            FlexBook v{config.APP.VERSION} • {config.FEATURES.USE_MOCK_API ? 'Development' : 'Production'} Mode
          </p>
        </div>
      </div>
    </div>
  );
};