// config/database.js
const { MongoClient } = require('mongodb');

let db = null;

async function connectToDatabase() {
    if (db) return db;
    
    try {
        // Replace with your MongoDB connection string
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system';
        
        const client = new MongoClient(connectionString);
        await client.connect();
        
        db = client.db();
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = { connectToDatabase };