import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT u.*, 
             COUNT(n.id) as note_count,
             COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as active_bookings,
             COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_classes
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.join_date DESC
    `);

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      concessions: user.concessions,
      join_date: user.join_date,
      last_login: user.last_login,
      is_active: user.is_active,
      note_count: parseInt(user.note_count),
      active_bookings: parseInt(user.active_bookings),
      completed_classes: parseInt(user.completed_classes)
    }));

    res.json({ users });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: 'Unable to retrieve user information'
    });
  }
});

// Get single user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const result = await query(`
      SELECT u.*, 
             COUNT(n.id) as note_count,
             COUNT(b.id) FILTER (WHERE b.status = 'confirmed') as active_bookings,
             COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_classes
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist'
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        concessions: user.concessions,
        join_date: user.join_date,
        last_login: user.last_login,
        is_active: user.is_active,
        note_count: parseInt(user.note_count),
        active_bookings: parseInt(user.active_bookings),
        completed_classes: parseInt(user.completed_classes)
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'Unable to retrieve user information'
    });
  }
});

// Update user concessions (admin only)
router.patch('/:id/concessions', authenticateToken, requireAdmin, [
  body('concessions').isInt().withMessage('Concessions must be a number')
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

    const userId = parseInt(req.params.id);
    const { concessions } = req.body;

    // Get current user concessions
    const currentResult = await query('SELECT concessions FROM users WHERE id = $1', [userId]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The user you are trying to update does not exist'
      });
    }

    const currentConcessions = currentResult.rows[0].concessions;
    const newConcessions = currentConcessions + concessions;

    // Update user concessions
    const result = await query(`
      UPDATE users 
      SET concessions = $1 
      WHERE id = $2 
      RETURNING id, name, email, concessions
    `, [newConcessions, userId]);

    const updatedUser = result.rows[0];

    res.json({
      message: `User concessions updated: ${currentConcessions} + ${concessions} = ${newConcessions}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user concessions error:', error);
    res.status(500).json({
      error: 'Failed to update concessions',
      message: 'Unable to update user concessions'
    });
  }
});

// Toggle user active status (admin only)
router.patch('/:id/toggle-active', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const result = await query(`
      UPDATE users 
      SET is_active = NOT is_active 
      WHERE id = $1 
      RETURNING id, name, email, is_active
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The user you are trying to update does not exist'
      });
    }

    const updatedUser = result.rows[0];

    res.json({
      message: `User account ${updatedUser.is_active ? 'activated' : 'deactivated'}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      message: 'Unable to update user status'
    });
  }
});

// Get user's booking history (admin only)
router.get('/:id/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
      SELECT b.*, c.name as class_name, c.time as class_time, c.instructor, c.duration
      FROM bookings b
      JOIN classes c ON b.class_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, c.time DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const countResult = await query('SELECT COUNT(*) as total FROM bookings WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      bookings: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < total
      }
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      error: 'Failed to get user bookings',
      message: 'Unable to retrieve user booking history'
    });
  }
});

// Get user statistics (admin only)
router.get('/:id/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const statsResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_classes,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'late-cancelled') as late_cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed' AND booking_date > CURRENT_DATE) as upcoming_bookings,
        COALESCE(SUM(CASE WHEN used_concession THEN 1 ELSE 0 END), 0) as concessions_used
      FROM bookings 
      WHERE user_id = $1
    `, [userId]);

    const notesResult = await query(`
      SELECT COUNT(*) as note_count FROM notes WHERE user_id = $1
    `, [userId]);

    const stats = {
      ...statsResult.rows[0],
      note_count: parseInt(notesResult.rows[0].note_count)
    };

    // Convert string counts to integers
    Object.keys(stats).forEach(key => {
      if (typeof stats[key] === 'string') {
        stats[key] = parseInt(stats[key]);
      }
    });

    res.json({ stats });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to get user statistics',
      message: 'Unable to retrieve user statistics'
    });
  }
});

export default router;