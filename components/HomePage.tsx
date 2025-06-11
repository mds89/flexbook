import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, Users, Trophy, Star } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to FlexGym
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your fitness journey with our premium gym experience. Book classes, train with expert instructors, and achieve your goals.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Button size="lg" asChild>
                <Link to="/book">Book a Class</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <Clock className="w-12 h-12 text-primary mb-2" />
            <CardTitle>Flexible Scheduling</CardTitle>
            <CardDescription>
              Book morning and evening classes that fit your busy lifestyle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Morning sessions: Monday & Friday at 7:00 AM<br/>
              Evening sessions: Monday, Wednesday & Friday at 6:00 PM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="w-12 h-12 text-primary mb-2" />
            <CardTitle>Expert Instructors</CardTitle>
            <CardDescription>
              Train with certified professionals who care about your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our team of experienced trainers provides personalized guidance for all fitness levels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Trophy className="w-12 h-12 text-primary mb-2" />
            <CardTitle>Proven Results</CardTitle>
            <CardDescription>
              Join hundreds of members who have achieved their fitness goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              From weight loss to strength building, our programs deliver real results.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Class Schedule Preview */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Weekly Class Schedule</h2>
          <p className="text-muted-foreground mt-2">Choose from our variety of fitness classes</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Morning Power Session</CardTitle>
              <CardDescription>Monday 7:00 AM</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">High-intensity morning workout with Sarah Johnson</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">60 minutes</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HIIT Friday</CardTitle>
              <CardDescription>Friday 7:30 AM</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Explosive HIIT session with Mike Chen</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">45 minutes</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Strength Training</CardTitle>
              <CardDescription>Monday 6:00 PM</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Build strength with David Rodriguez</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">75 minutes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild>
            <Link to={user ? "/book" : "/register"}>
              {user ? "Book Now" : "Join to Book Classes"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">What Our Members Say</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "FlexGym has completely transformed my fitness routine. The instructors are amazing and the booking system makes it so easy to plan my workouts."
              </p>
              <p className="font-medium">- Jessica M.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "Great variety of classes and perfect timing options. I can fit workouts into my busy schedule easily."
              </p>
              <p className="font-medium">- Michael R.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "The community here is fantastic. Everyone is supportive and the trainers really care about your progress."
              </p>
              <p className="font-medium">- Sarah L.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};