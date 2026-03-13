const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all messages for user
router.get('/:userId', async (req, res) => {
    try {
        const query = `
            SELECT m.*, u.full_name as sender_name 
            FROM messages m 
            LEFT JOIN users u ON m.sender_id = u.id 
            WHERE m.sender_id = $1 OR m.receiver_id = $2
            ORDER BY m.created_at ASC 
            LIMIT 100
        `;
        const messages = await db.query(query, [req.params.userId, req.params.userId]);

        const formatted = messages.map(m => ({
            ...m,
            sender: m.sender_name ? { full_name: m.sender_name } : null
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create message
router.post('/', async (req, res) => {
    try {
        const { sender_id, receiver_id, content } = req.body;
        if (!sender_id || !content) {
            return res.status(400).json({ error: 'sender_id and content are required' });
        }

        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4)',
            [id, sender_id, receiver_id || null, content]
        );

        const newMessage = await db.getAsync(`
            SELECT m.*, u.full_name as sender_name 
            FROM messages m 
            LEFT JOIN users u ON m.sender_id = u.id 
            WHERE m.id = $1
        `, [id]);

        const formatted = {
            ...newMessage,
            sender: newMessage?.sender_name ? { full_name: newMessage.sender_name } : null
        };

        res.json(formatted);
    } catch (err) {
        console.error('Create message error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
