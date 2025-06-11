import bcrypt from 'bcryptjs';
import { query } from './connection.js';

const seedData = async () => {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Clear existing data (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️  Clearing existing data...');
      await query('DELETE FROM notes');
      await query('DELETE FROM payments');
      await query('DELETE FROM bookings');
      await query('DELETE FROM classes');
      await query('DELETE FROM users');
      
      // Reset sequences
      await query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await query('ALTER SEQUENCE classes_id_seq RESTART WITH 1');
      await query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');
      await query('ALTER SEQUENCE notes_id_seq RESTART WITH 1');
      await query('ALTER SEQUENCE payments_id_seq RESTART WITH 1');
    }
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminResult = await query(`
      INSERT INTO users (name, email, password_hash, role, concessions) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        concessions = EXCLUDED.concessions
      RETURNING id
    `, ['Admin User', 'admin@gym.com', adminPassword, 'admin', 10]);
    
    // Create test user
    const userPassword = await bcrypt.hash('user123', 12);
    const userResult = await query(`
      INSERT INTO users (name, email, password_hash, role, concessions) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        concessions = EXCLUDED.concessions
      RETURNING id
    `, ['Test User', 'user@gym.com', userPassword, 'user', 5]);
    
    console.log('✅ Users created');
    
    // Create sample classes
    const classes = [
      {
        name: 'Morning Yoga',
        time: '07:00',
        duration: '60 minutes',
        instructor: 'Sarah Johnson',
        max_capacity: 20,
        description: 'Start your day with energizing yoga flow',
        category: 'morning',
        days: ['Monday', 'Friday'],
        status: 'published',
        publish_date: '2024-01-01',
        start_date: '2024-01-15'
      },
      {
        name: 'Strength Training',
        time: '17:30',
        duration: '45 minutes',
        instructor: 'Mike Davis',
        max_capacity: 15,
        description: 'Build strength with guided weight training',
        category: 'afternoon',
        days: ['Monday', 'Wednesday', 'Friday'],
        status: 'published',
        publish_date: '2024-01-01',
        start_date: '2024-01-20'
      },
      {
        name: 'HIIT Workout',
        time: '18:30',
        duration: '45 minutes',
        instructor: 'Emma Wilson',
        max_capacity: 12,
        description: 'High-intensity interval training for maximum results',
        category: 'afternoon',
        days: ['Tuesday', 'Thursday'],
        status: 'published',
        publish_date: '2024-01-01',
        start_date: '2024-01-22'
      },
      {
        name: 'Advanced Pilates',
        time: '19:00',
        duration: '50 minutes',
        instructor: 'Lisa Brown',
        max_capacity: 10,
        description: 'Advanced pilates for experienced practitioners',
        category: 'afternoon',
        days: ['Wednesday', 'Saturday'],
        status: 'scheduled',
        publish_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];
    
    for (const classData of classes) {
      await query(`
        INSERT INTO classes (name, time, duration, instructor, max_capacity, description, category, days, status, publish_date, start_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT DO NOTHING
      `, [
        classData.name,
        classData.time,
        classData.duration,
        classData.instructor,
        classData.max_capacity,
        classData.description,
        classData.category,
        classData.days,
        classData.status,
        classData.publish_date,
        classData.start_date
      ]);
    }
    
    console.log('✅ Classes created');
    
    // Create some sample bookings (recent activity)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const sampleBookings = [
      {
        user_id: userResult.rows[0]?.id || 2,
        class_id: 1,
        booking_date: tomorrow.toISOString().split('T')[0],
        status: 'confirmed'
      },
      {
        user_id: userResult.rows[0]?.id || 2,
        class_id: 2,
        booking_date: dayAfter.toISOString().split('T')[0],
        status: 'confirmed'
      }
    ];
    
    for (const booking of sampleBookings) {
      try {
        await query(`
          INSERT INTO bookings (user_id, class_id, booking_date, status, used_concession)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, class_id, booking_date) DO NOTHING
        `, [booking.user_id, booking.class_id, booking.booking_date, booking.status, true]);
      } catch (error) {
        // Ignore conflicts - bookings might already exist
        console.log('Booking already exists, skipping...');
      }
    }
    
    console.log('✅ Sample bookings created');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Demo Accounts:');
    console.log('Admin: admin@gym.com / admin123');
    console.log('User:  user@gym.com / user123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => {
      console.log('🌟 Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding script failed:', error);
      process.exit(1);
    });
}

export { seedData };