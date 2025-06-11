import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/connection.js';
import { authenticateToken, requireAdmin, requireUser } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateBooking = [
  body('class_id').isInt({ min: 1 }).withMessage('Valid class ID is required'),
  body('booking_date').isISO8601().toDate().withMessage('Valid booking date is required')
];

// Helper function to check if date is within booking window
const isWithinBookingWindow = (bookingDate) => {
  const today = new Date();
  const booking = new Date(bookingDate);
  const diffTime = booking.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= 14; // Can book up to 14 days in advance
};

// Helper function to check if cancellation is late
const isLateCancellation = (bookingDate, classTime) => {
  const now = new Date();
  const classDateTime = new Date(`${bookingDate}T${classTime}:00`);
  const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilClass <= 24 && hoursUntilClass > 0;
};

// Get user's bookings
router.get('/my-bookings', authenticateToken, requireUser, async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*, c.name as class_name, c.time as class_time, c.instructor, c.duration
      FROM bookings b
      JOIN classes c ON b.class_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, c.time DESC
    `, [req.user.id]);

    res.json({ bookings: result.rows });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      error: 'Failed to get bookings',
      message: 'Unable to retrieve your bookings'
    });
  }
});

// Get all bookings (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, date, user_id, class_id } = req.query;
    
    let queryText = `
      SELECT b.*, u.name as user_name, u.email as user_email, 
             c.name as class_name, c.time as class_time, c.instructor
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN classes c ON b.class_id = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND b.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (date) {
      queryText += ` AND b.booking_date = $${paramIndex}`;
      queryParams.push(date);
      paramIndex++;
    }

    if (user_id) {
      queryText += ` AND b.user_id = $${paramIndex}`;
      queryParams.push(parseInt(user_id));
      paramIndex++;
    }

    if (class_id) {
      queryText += ` AND b.class_id = $${paramIndex}`;
      queryParams.push(parseInt(class_id));
      paramIndex++;
    }

    queryText += ' ORDER BY b.booking_date DESC, c.time DESC';

    const result = await query(queryText, queryParams);

    res.json({ bookings: result.rows });

  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      error: 'Failed to get bookings',
      message: 'Unable to retrieve bookings'
    });
  }
});

// Create booking
router.post('/', authenticateToken, requireUser, validateBooking, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { class_id, booking_date } = req.body;
    const userId = req.user.id;

    // Check if booking date is within allowed window
    if (!isWithinBookingWindow(booking_date)) {
      return res.status(400).json({
        error: 'Invalid booking date',
        message: 'You can only book classes up to 14 days in advance'
      });
    }

    // Check if class exists and is available for booking
    const classResult = await query(`
      SELECT * FROM classes WHERE id = $1
    `, [class_id]);

    if (classResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'The selected class does not exist'
      });
    }

    const classData = classResult.rows[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Check if class is available for booking
    if (classData.status === 'draft' || 
        (classData.status === 'scheduled' && classData.publish_date > today)) {
      return res.status(400).json({
        error: 'Class not available',
        message: 'This class is not currently available for booking'
      });
    }

    // Check if user has sufficient concessions (allow up to -5)
    const userResult = await query('SELECT concessions FROM users WHERE id = $1', [userId]);
    const currentConcessions = userResult.rows[0].concessions;

    if (currentConcessions <= -5) {
      return res.status(400).json({
        error: 'Insufficient concessions',
        message: 'You have reached the maximum credit limit. Please make a payment to continue booking classes.'
      });
    }

    // Check if user already has a booking for this class and date
    const existingBooking = await query(`
      SELECT id FROM bookings 
      WHERE user_id = $1 AND class_id = $2 AND booking_date = $3 AND status = 'confirmed'
    `, [userId, class_id, booking_date]);

    if (existingBooking.rows.length > 0) {
      return res.status(409).json({
        error: 'Already booked',
        message: 'You have already booked this class for this date'
      });
    }

    // Check class capacity
    const capacityResult = await query(`
      SELECT COUNT(*) as current_bookings 
      FROM bookings 
      WHERE class_id = $1 AND booking_date = $2 AND status = 'confirmed'
    `, [class_id, booking_date]);

    const currentBookings = parseInt(capacityResult.rows[0].current_bookings);
    
    if (currentBookings >= classData.max_capacity) {
      return res.status(400).json({
        error: 'Class full',
        message: 'This class is fully booked for the selected date'
      });
    }

    // Create booking
    const bookingResult = await query(`
      INSERT INTO bookings (user_id, class_id, booking_date, status, used_concession)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, class_id, booking_date, 'confirmed', true]);

    // Update user concessions
    await query(`
      UPDATE users SET concessions = concessions - 1 WHERE id = $1
    `, [userId]);

    const newBooking = bookingResult.rows[0];
    const isNegative = currentConcessions - 1 < 0;

    res.status(201).json({
      message: isNegative 
        ? 'Booking created using credit. Please make a payment soon to avoid booking restrictions.'
        : 'Booking created successfully',
      booking: newBooking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      message: 'Unable to create booking. Please try again.'
    });
  }
});

// Cancel booking
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    
    // Get booking with class information
    const bookingResult = await query(`
      SELECT b.*, c.time as class_time
      FROM bookings b
      JOIN classes c ON b.class_id = c.id
      WHERE b.id = $1
    `, [bookingId]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Booking not found',
        message: 'The booking you are trying to cancel does not exist'
      });
    }

    const booking = bookingResult.rows[0];

    // Check if user owns this booking or is admin
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only cancel your own bookings'
      });
    }

    // Check if booking can be cancelled
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        error: 'Cannot cancel booking',
        message: 'Only confirmed bookings can be cancelled'
      });
    }

    // Check if it's a late cancellation
    const isLate = isLateCancellation(booking.booking_date, booking.class_time);
    
    // Update booking status
    const updateResult = await query(`
      UPDATE bookings 
      SET status = $1, cancellation_time = CURRENT_TIMESTAMP, is_late_cancellation = $2
      WHERE id = $3
      RETURNING *
    `, [isLate ? 'late-cancelled' : 'cancelled', isLate, bookingId]);

    // Refund concession if not late cancellation and concession was used
    let concessionRefunded = false;
    if (!isLate && booking.used_concession) {
      await query('UPDATE users SET concessions = concessions + 1 WHERE id = $1', [booking.user_id]);
      concessionRefunded = true;
    }

    const updatedBooking = updateResult.rows[0];

    res.json({
      message: isLate 
        ? 'Late cancellation: You have been charged a concession'
        : 'Booking cancelled successfully. Your concession has been refunded.',
      booking: updatedBooking,
      isLateCancellation: isLate,
      concessionRefunded
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      error: 'Failed to cancel booking',
      message: 'Unable to cancel booking. Please try again.'
    });
  }
});

// Mark class as completed (admin only)
router.patch('/complete-class', authenticateToken, requireAdmin, [
  body('class_id').isInt({ min: 1 }).withMessage('Valid class ID is required'),
  body('booking_date').isISO8601().toDate().withMessage('Valid booking date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { class_id, booking_date } = req.body;

    const result = await query(`
      UPDATE bookings 
      SET status = 'completed'
      WHERE class_id = $1 AND booking_date = $2 AND status = 'confirmed'
      RETURNING *
    `, [class_id, booking_date]);

    const updatedCount = result.rows.length;

    res.json({
      message: `Class marked as completed for ${updatedCount} booking(s)`,
      updated_bookings: updatedCount
    });

  } catch (error) {
    console.error('Complete class error:', error);
    res.status(500).json({
      error: 'Failed to complete class',
      message: 'Unable to mark class as completed'
    });
  }
});

// Undo class completion (admin only)
router.patch('/undo-complete-class', authenticateToken, requireAdmin, [
  body('class_id').isInt({ min: 1 }).withMessage('Valid class ID is required'),
  body('booking_date').isISO8601().toDate().withMessage('Valid booking date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { class_id, booking_date } = req.body;

    const result = await query(`
      UPDATE bookings 
      SET status = 'confirmed'
      WHERE class_id = $1 AND booking_date = $2 AND status = 'completed'
      RETURNING *
    `, [class_id, booking_date]);

    const updatedCount = result.rows.length;

    res.json({
      message: `Class completion undone for ${updatedCount} booking(s)`,
      updated_bookings: updatedCount
    });

  } catch (error) {
    console.error('Undo complete class error:', error);
    res.status(500).json({
      error: 'Failed to undo class completion',
      message: 'Unable to undo class completion'
    });
  }
});

export default router;