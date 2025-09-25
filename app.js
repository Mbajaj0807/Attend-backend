const express = require('express');
const app = express();
const cors = require("cors");
const authRoutes = require('./routes/auth');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./modules/attendance');
require('dotenv').config();
const { connectToDatabase } = require('./config/database');

app.use(express.json());

// Enable CORS for your frontend - FIXED: Use array for multiple origins
app.use(cors({
    origin: [
        'http://localhost:5173', // React dev server URL
        'https://attend-frontend-chi.vercel.app'
    ],
    credentials: true // allow cookies
}));

// Use the routes
app.use('/auth', authRoutes);
app.use('/timetable', timetableRoutes);
app.use('/api', attendanceRoutes);

// Start server and connect to database
async function startServer() {
    try {
        // Connect to MongoDB first
        await connectToDatabase();
        console.log('Connected to MongoDB successfully');
        
        // Then start the server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();