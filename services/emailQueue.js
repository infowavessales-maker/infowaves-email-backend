const { sendEmail } = require('./googleService');

// Simple in-memory queue for demonstration. 
// In production, use Redis or database.
let emailQueue = [];
let isProcessing = false;
const DELAY_MS = 2000; // 2 seconds delay between emails

const addToQueue = (contacts, subject, template) => {
    const tasks = contacts.map(contact => ({
        email: contact.email,
        name: contact.name,
        subject,
        template,
        status: 'pending' // pending, sent, failed
    }));
    emailQueue.push(...tasks);
    processQueue();
};

const processQueue = async () => {
    if (isProcessing || emailQueue.length === 0) return;
    isProcessing = true;

    const processNext = async () => {
        if (emailQueue.length === 0) {
            isProcessing = false;
            return;
        }

        const task = emailQueue[0]; // Peek
        // If already sent/failed, remove (shouldn't happen in this simple logic, but safe check)
        if (task.status !== 'pending') {
            emailQueue.shift();
            processNext();
            return;
        }

        try {
            // Replace variables
            let personalizedBody = task.template.replace(/{{name}}/g, task.name || '')
                .replace(/{{email}}/g, task.email || '');

            console.log(`Sending to ${task.email}...`);
            await sendEmail(task.email, task.subject, personalizedBody);
            task.status = 'sent';
            task.timestamp = new Date();
        } catch (error) {
            console.error(`Failed to send to ${task.email}`, error);
            task.status = 'failed';
            task.error = error.message;
        }

        // Move to processed log or keep in queue? 
        // For now, keep in memory "logs" but remove from active queue to avoid reprocessing?
        // Actually, let's move processed items to a separate "logs" array.
        completedLogs.push(emailQueue.shift());

        // Delay before next
        setTimeout(processNext, DELAY_MS);
    };

    processNext();
};

let completedLogs = [];

const getLogs = () => {
    return [...completedLogs, ...emailQueue].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const getQueueStatus = () => {
    return {
        pending: emailQueue.length,
        completed: completedLogs.length,
        isProcessing
    };
};

module.exports = { addToQueue, getLogs, getQueueStatus };
