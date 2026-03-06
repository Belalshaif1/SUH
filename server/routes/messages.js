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
            WHERE m.sender_id = ? OR m.receiver_id = ? 
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
        res.status(500).json({ error: err.message });
    }
});

// Create message
router.post('/', async (req, res) => {
    try {
        const { sender_id, receiver_id, content } = req.body;
        const id = uuidv4();
        await db.runAsync(
            'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
            [id, sender_id, receiver_id || null, content]
        );

        // Return created message with sender info to match Supabase realtime expected format
        const query = `
            SELECT m.*, u.full_name as sender_name 
            FROM messages m 
            LEFT JOIN users u ON m.sender_id = u.id 
            WHERE m.id = ?
        `;
        const newMessage = await db.getAsync(query, [id]);

        const formatted = {
            ...newMessage,
            sender: newMessage.sender_name ? { full_name: newMessage.sender_name } : null
        };

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
