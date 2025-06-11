-- FlexBook Database Schema
-- Gym Class Booking System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    concessions INTEGER DEFAULT 5,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    time TIME NOT NULL,
    duration VARCHAR(50) NOT NULL,
    instructor VARCHAR(255) NOT NULL,
    max_capacity INTEGER DEFAULT 20,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('morning', 'afternoon', 'evening', 'general')),
    days TEXT[] NOT NULL, -- Array of days: ['Monday', 'Tuesday', etc.]
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'draft', 'scheduled', 'archived')),
    publish_date DATE, -- When the class becomes available for booking
    start_date DATE, -- When the class physically starts
    end_date DATE, -- When the class physically ends (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'late-cancelled')),
    used_concession BOOLEAN DEFAULT true,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancellation_time TIMESTAMP,
    is_late_cancellation BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, class_id, booking_date) -- Prevent duplicate bookings
);

-- Notes table (for admin notes about users)
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment records table (for tracking concession purchases)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    concessions_purchased INTEGER NOT NULL,
    payment_method VARCHAR(100) DEFAULT 'bank_transfer',
    reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    notes TEXT,
    processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_days ON classes USING GIN(days);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for easier querying
CREATE OR REPLACE VIEW booking_details AS
SELECT 
    b.id,
    b.user_id,
    u.name as user_name,
    u.email as user_email,
    b.class_id,
    c.name as class_name,
    c.time as class_time,
    c.instructor,
    b.booking_date,
    b.status,
    b.used_concession,
    b.booking_time,
    b.cancellation_time,
    b.is_late_cancellation
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN classes c ON b.class_id = c.id;

-- View for class schedules with booking counts
CREATE OR REPLACE VIEW class_schedule AS
SELECT 
    c.*,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as total_bookings,
    COUNT(DISTINCT b.user_id) FILTER (WHERE b.status = 'confirmed') as unique_users
FROM classes c
LEFT JOIN bookings b ON c.id = b.class_id
GROUP BY c.id;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;