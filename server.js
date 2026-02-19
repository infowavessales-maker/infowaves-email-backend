const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const apiRoutes = require('./routes/api');

app.use(cors({
    origin: "https://infowaves.co.in"
}));
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('Email Automation Dashboard API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
