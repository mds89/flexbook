import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateNote = [
  body('content').trim().isLength({ min: 1 }).withMessage('Note content is required'),
  body('category').optional().trim().isLength({ min: 1 }).withMessage('Category cannot be empty')
];

// Get all notes (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, category, limit = 100, offset = 0 } = req.query;
    
    let queryText = `
      SELECT n.*, u.name as user_name, u.email as user_email,
             creator.name as created_by_name
      FROM notes n
      JOIN users u ON n.user_id = u.id
      LEFT JOIN users creator ON n.created_by = creator.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    if (userId) {
      queryText += ` AND n.user_id = $${paramIndex}`;
      queryParams.push(parseInt(userId));
      paramIndex++;
    }

    if (category) {
      queryText += ` AND n.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    queryText += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notes WHERE 1=1';
    const countParams = [];
    let countParamIndex = 1;

    if (userId) {
      countQuery += ` AND user_id = $${countParamIndex}`;
      countParams.push(parseInt(userId));
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      notes: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < total
      }
    });

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      error: 'Failed to get notes',
      message: 'Unable to retrieve notes'
    });
  }
});

// Get notes for specific user (admin only)
router.get('/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { category, limit = 50, offset = 0 } = req.query;
    
    let queryText = `
      SELECT n.*, creator.name as created_by_name
      FROM notes n
      LEFT JOIN users creator ON n.created_by = creator.id
      WHERE n.user_id = $1
    `;
    
    const queryParams = [userId];
    let paramIndex = 2;

    if (category) {
      queryText += ` AND n.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    queryText += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM notes WHERE user_id = $1';
    const countParams = [userId];

    if (category) {
      countQuery += ' AND category = $2';
      countParams.push(category);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      notes: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < total
      }
    });

  } catch (error) {
    console.error('Get user notes error:', error);
    res.status(500).json({
      error: 'Failed to get user notes',
      message: 'Unable to retrieve user notes'
    });
  }
});

// Create note (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('user_id').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  ...validateNote
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

    const { user_id, content, category = 'general' } = req.body;

    // Verify user exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    const result = await query(`
      INSERT INTO notes (user_id, content, category, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [user_id, content, category, req.user.id]);

    const newNote = result.rows[0];

    res.status(201).json({
      message: 'Note created successfully',
      note: newNote
    });

  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      error: 'Failed to create note',
      message: 'Unable to create note. Please try again.'
    });
  }
});

// Update note (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateNote, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const noteId = parseInt(req.params.id);
    const { content, category = 'general' } = req.body;

    const result = await query(`
      UPDATE notes 
      SET content = $1, category = $2
      WHERE id = $3
      RETURNING *
    `, [content, category, noteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Note not found',
        message: 'The note you are trying to update does not exist'
      });
    }

    const updatedNote = result.rows[0];

    res.json({
      message: 'Note updated successfully',
      note: updatedNote
    });

  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      error: 'Failed to update note',
      message: 'Unable to update note. Please try again.'
    });
  }
});

// Delete note (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);

    const result = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [noteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Note not found',
        message: 'The note you are trying to delete does not exist'
      });
    }

    res.json({
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      error: 'Failed to delete note',
      message: 'Unable to delete note. Please try again.'
    });
  }
});

// Get note categories (admin only)
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT category, COUNT(*) as count
      FROM notes
      GROUP BY category
      ORDER BY count DESC, category ASC
    `);

    const categories = result.rows.map(row => ({
      name: row.category,
      count: parseInt(row.count)
    }));

    res.json({ categories });

  } catch (error) {
    console.error('Get note categories error:', error);
    res.status(500).json({
      error: 'Failed to get categories',
      message: 'Unable to retrieve note categories'
    });
  }
});

export default router;