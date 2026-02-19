const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
}

// Helper to check if credentials are set
const checkCredentials = () => {
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_client_id') {
        throw new Error('GOOGLE_CLIENT_ID is not set in server/.env');
    }
    if (!process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN === 'your_refresh_token') {
        throw new Error('GOOGLE_REFRESH_TOKEN is not set in server/.env');
    }
};

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const getSheetData = async (spreadsheetId, range) => {
    checkCredentials();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data.values;
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        throw error;
    }
};

const sendEmail = async (to, subject, body) => {
    checkCredentials();
    try {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            body,
        ];
        const message = messageParts.join('\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        return res.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { getSheetData, sendEmail, oauth2Client };
