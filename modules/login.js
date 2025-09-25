// modules/login.js
const axios = require('axios');
const { connectToDatabase } = require('../config/database');

// Save auth info for a specific email, keeping existing ones
async function saveAuth(email, cookie, progressionData, stuid) {
    const normalizedEmail = email.toLowerCase(); // normalize
    
    try {
        const db = await connectToDatabase();
        const collection = db.collection('user_auth');
        
        // Check if email already exists
        const existingUser = await collection.findOne({ email: normalizedEmail });
        
        if (!existingUser) {
            await collection.insertOne({
                email: normalizedEmail,
                cookie,
                progressionData,
                stuid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`Auth saved for ${normalizedEmail}`);
        } else {
            console.log(`Auth for ${normalizedEmail} already exists. Not updating.`);
        }
    } catch (error) {
        console.error(`Error saving auth for ${normalizedEmail}:`, error);
        throw error;
    }
}

// Get stored auth info for specific email
async function getAuth(email) {
    const normalizedEmail = email.toLowerCase(); // normalize
    
    try {
        const db = await connectToDatabase();
        const collection = db.collection('user_auth');
        
        const user = await collection.findOne({ email: normalizedEmail });
        
        if (user) {
            return {
                cookie: user.cookie,
                progressionData: user.progressionData,
                stuid: user.stuid
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Error getting auth for ${normalizedEmail}:`, error);
        throw error;
    }
}

// Get all stored auth data (for attendance marking)
async function getAllAuth() {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('user_auth');
        
        const users = await collection.find({}).toArray();
        
        // Convert to the format expected by attendance.js
        const allAuth = {};
        users.forEach(user => {
            allAuth[user.email] = {
                cookie: user.cookie,
                progressionData: user.progressionData,
                stuid: user.stuid
            };
        });
        
        return allAuth;
    } catch (error) {
        console.error('Error getting all auth data:', error);
        throw error;
    }
}

// Login function
async function login(email, password) {
    const normalizedEmail = email.toLowerCase(); // normalize

    // Check if email already has auth stored
    const existingAuth = await getAuth(normalizedEmail);
    if (existingAuth) {
        console.log(`User ${normalizedEmail} already logged in. Returning stored auth.`);
        return existingAuth;
    }

    const url = 'https://student.bennetterp.camu.in/login/validate';
    const payload = { dtype: 'M', Email: normalizedEmail, pwd: password };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'content-type': 'application/json',
                'appversion': 'v2',
                'clienttzofst': '330',
                'origin': 'https://student.bennetterp.camu.in',
                'referer': 'https://student.bennetterp.camu.in/v2/login',
                'user-agent': 'Mozilla/5.0'
            },
            withCredentials: true
        });

        const setCookie = response.headers['set-cookie'];
        if (!setCookie || setCookie.length === 0) throw new Error('No cookie returned');

        const cookieStr = setCookie.map(c => c.split(';')[0]).join('; ');

        // Extract progressionData and StuID from response
        const userRecord = response.data;
        const progression = userRecord.output?.data?.progressionData?.[0];
        const stuid = userRecord.output?.data?.logindetails?.Student?.[0]?.StuID;

        if (!progression) throw new Error('Login Failed');
        if (!stuid) throw new Error('No StuID found');

        const progressionData = {
            PrID: progression.PrID,
            CrID: progression.CrID,
            AcYr: progression.AcYr,
            DeptID: progression.DeptID,
            SemID: progression.SemID
        };

        await saveAuth(normalizedEmail, cookieStr, progressionData, stuid);

        return { cookie: cookieStr, progressionData, stuid };

    } catch (err) {
        console.error(`Login failed for ${normalizedEmail}:`, err.message);
        throw err;
    }
}

module.exports = { login, getAuth, getAllAuth };