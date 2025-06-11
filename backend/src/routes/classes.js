import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateClass = [
  body('name').trim().isLength({ min: 2 }).withMessage('Class name must be at least 2 characters'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
  body('duration').trim().isLength({ min: 1 }).withMessage('Duration is required'),
  body('instructor').trim().isLength({ min: 2 }).withMessage('Instructor name must be at least 2 characters'),
  body('max_capacity').isInt({ min: 1, max: 100 }).withMessage('Max capacity must be between 1 and 100'),
  body('description').optional().trim(),
  body('category').isIn(['morning', 'afternoon', 'evening', 'general']).withMessage('Invalid category'),
  body('days').isArray({ min: 1 }).withMessage('At least one day must be selected'),
  body('status').optional().isIn(['published', 'draft', 'scheduled']).withMessage('Invalid status')
];

// Helper function to check if class is available for booking
const isClassAvailableForBooking = (classData) => {
  const today = new Date().toISOString().split('T')[0];
  
  if (classData.status === 'draft') return false;
  if (classData.status === 'published') return true;
  if (classData.status === 'scheduled' && classData.publish_date) {
    return classData.publish_date <= today;
  }
  return false;
};

// Get all classes (for regular users - only available for booking)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, 
             COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as current_bookings
      FROM classes c
      LEFT JOIN bookings b ON c.id = b.class_id 
      GROUP BY c.id
      ORDER BY c.name, c.time
    `);

    // For regular users, filter to only show classes available for booking
    let classes = result.rows;
    if (req.user.role !== 'admin') {
      classes = classes.filter(isClassAvailableForBooking);
    }

    res.json({ classes });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      error: 'Failed to get classes',
      message: 'Unable to retrieve class information'
    });
  }
});

// Get all classes for admin (includes all statuses)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, 
             COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as current_bookings,
             COUNT(DISTINCT b.user_id) FILTER (WHERE b.status = 'confirmed') as unique_users
      FROM classes c
      LEFT JOIN bookings b ON c.id = b.class_id 
      GROUP BY c.id
      ORDER BY c.status, c.name, c.time
    `);

    res.json({ classes: result.rows });

  } catch (error) {
    console.error('Get admin classes error:', error);
    res.status(500).json({
      error: 'Failed to get classes',
      message: 'Unable to retrieve class information'
    });
  }
});

// Get single class by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    
    const result = await query(`
      SELECT c.*, 
             COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as current_bookings
      FROM classes c
      LEFT JOIN bookings b ON c.id = b.class_id 
      WHERE c.id = $1
      GROUP BY c.id
    `, [classId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'The requested class does not exist'
      });
    }

    const classData = result.rows[0];
    
    // Check if user can access this class
    if (req.user.role !== 'admin' && !isClassAvailableForBooking(classData)) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'The requested class is not available'
      });
    }

    res.json({ class: classData });

  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      error: 'Failed to get class',
      message: 'Unable to retrieve class information'
    });
  }
});

// Create new class (admin only)
router.post('/', authenticateToken, requireAdmin, validateClass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const {
      name,
      time,
      duration,
      instructor,
      max_capacity,
      description,
      category,
      days,
      status = 'published',
      publish_date,
      start_date,
      end_date
    } = req.body;

    const result = await query(`
      INSERT INTO classes (name, time, duration, instructor, max_capacity, description, category, days, status, publish_date, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [name, time, duration, instructor, max_capacity, description, category, days, status, publish_date, start_date, end_date]);

    const newClass = result.rows[0];

    res.status(201).json({
      message: 'Class created successfully',
      class: newClass
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      error: 'Failed to create class',
      message: 'Unable to create class. Please try again.'
    });
  }
});

// Update class (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateClass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const classId = parseInt(req.params.id);
    const {
      name,
      time,
      duration,
      instructor,
      max_capacity,
      description,
      category,
      days,
      status,
      publish_date,
      start_date,
      end_date
    } = req.body;

    const result = await query(`
      UPDATE classes 
      SET name = $1, time = $2, duration = $3, instructor = $4, max_capacity = $5, 
          description = $6, category = $7, days = $8, status = $9, 
          publish_date = $10, start_date = $11, end_date = $12
      WHERE id = $13
      RETURNING *
    `, [name, time, duration, instructor, max_capacity, description, category, days, status, publish_date, start_date, end_date, classId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'The class you are trying to update does not exist'
      });
    }

    const updatedClass = result.rows[0];

    res.json({
      message: 'Class updated successfully',
      class: updatedClass
    });

  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      error: 'Failed to update class',
      message: 'Unable to update class. Please try again.'
    });
  }
});

// Delete class (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);

    // Check if there are active future bookings
    const bookingsResult = await query(`
      SELECT COUNT(*) as count 
      FROM bookings 
      WHERE class_id = $1 AND status = 'confirmed' AND booking_date > CURRENT_DATE
    `, [classId]);

    const activeBookings = parseInt(bookingsResult.rows[0].count);
    
    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete class',
        message: `This class has ${activeBookings} active future booking(s). Cancel these bookings first.`
      });
    }

    const result = await query('DELETE FROM classes WHERE id = $1 RETURNING name', [classId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Class not found',
        message: 'The class you are trying to delete does not exist'
      });
    }

    const deletedClassName = result.rows[0].name;

    res.json({
      message: `Class "${deletedClassName}" deleted successfully`
    });

  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      error: 'Failed to delete class',
      message: 'Unable to delete class. Please try again.'
    });
  }
});

// Get bookings for a specific class and date
router.get('/:id/bookings', authenticateToken, async (req, res) => {
  try {
    const classId = parseInt(req.params.id);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Date required',
        message: 'Please provide a date parameter'
      });
    }

    const result = await query(`
      SELECT b.*, u.name as user_name, u.email as user_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.class_id = $1 AND b.booking_date = $2 AND b.status = 'confirmed'
      ORDER BY b.booking_time
    `, [classId, date]);

    res.json({ bookings: result.rows });

  } catch (error) {
    console.error('Get class bookings error:', error);
    res.status(500).json({
      error: 'Failed to get bookings',
      message: 'Unable to retrieve booking information'
    });
  }
});

export default router;