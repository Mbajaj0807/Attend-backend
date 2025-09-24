const express = require('express');
const app = express();
const cors = require("cors");
const authRoutes = require('./routes/auth'); // make sure this path is correct
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./modules/attendance');



app.use(express.json());

// Enable CORS for your frontend
app.use(cors({
    origin: 'http://localhost:5173', // React dev server URL
    credentials: true               // allow cookies
}));

// Use the routes
app.use('/auth', authRoutes);
app.use('/timetable', timetableRoutes);
app.use('/api', attendanceRoutes);



// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
