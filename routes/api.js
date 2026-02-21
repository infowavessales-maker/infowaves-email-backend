const express = require('express');
const router = express.Router();
const { getSheetData, oauth2Client, sendEmail } = require('../services/googleService');
const { addToQueue, getLogs, getQueueStatus } = require('../services/emailQueue');

// Auth URL generation (for initial setup if needed)
router.get('/auth/url', (req, res) => {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
    ];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    res.json({ url });
});

// OAuth Callback (User manually visits this in browser to get code)
router.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        res.json({ tokens }); // In real app, save these securely!
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch Sheets Data
router.post('/sheets/fetch', async (req, res) => {
    const { spreadsheetId, range } = req.body; // range e.g. "Sheet1"
    try {
        const data = await getSheetData(spreadsheetId, range);
        // Assume first row is header
        const headers = data[0];
        const rows = data.slice(1);

        // Map to objects based on headers (assuming headers involve 'email', 'name')
        const contacts = rows.map(row => {
            let contact = {};
            headers.forEach((header, index) => {
                contact[header.toLowerCase()] = row[index];
            });
            return contact;
        });

        res.json({ contacts, headers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Campaign
router.post('/campaign/start', (req, res) => {
    const { contacts, subject, template } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ error: 'No contacts provided' });
    }

    addToQueue(contacts, subject, template);
    res.json({ message: 'Campaign started', count: contacts.length });
});

// Get Logs
router.get('/logs', (req, res) => {
    res.json(getLogs());
});

// Get Queue Status
router.get('/status', (req, res) => {
    res.json(getQueueStatus());
});

// Simple Test Email Route
router.post('/send-email', async (req, res) => {
    try {
        const { to, subject, html } = req.body;
        await sendEmail(to, subject, html);
        res.json({ success: true, message: 'Test email sent successfully' });
    } catch (error) {
        console.error('Error in /send-email route:', error);
        res.status(500).json({ error: "Failed to send email", details: error.message });
    }
});

module.exports = router;
