const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
// Use CORS to allow requests from the frontend
app.use(cors());
// Use express.json() to parse JSON bodies
app.use(express.json({ limit: '10mb' })); // Increased limit for logo images

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clinic', require('./routes/clinic'));
app.use('/api/prescriptions', require('./routes/prescriptions'));

// Simple route for checking server status
app.get('/', (req, res) => {
    res.send('Prescription API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));