const express = require('express');
const app = express();
const cors = require("cors");
const authRoutes = require('./routes/auth');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./modules/attendance');
require('dotenv').config();
const { connectToDatabase } = require('./config/database');

app.use(express.json());

// Enable CORS only for your deployed frontend
app.use(cors({
    origin: 'https://todo-app-lime-alpha.vercel.app', // Allow  origins
    credentials: true, // allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    optionsSuccessStatus: 200
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
            console.log(`Server running on port ${PORT}`);
            console.log(`CORS enabled for: ${process.env.FRONTEND_URL}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
