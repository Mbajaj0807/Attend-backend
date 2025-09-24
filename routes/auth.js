const express = require('express');
const router = express.Router();
const { login, getAuth } = require('../modules/login');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { cookie, progressionData } = await login(email, password);
        res.json({ 
            message: 'Logged in successfully', 
            cookie, 
            progressionData 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to get stored student data for a given email
router.get('/student/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const auth = getAuth(email);

        if (!auth) {
            return res.status(404).json({ error: 'No stored auth found for this email' });
        }

        res.json({ 
            email,
            cookie: auth.cookie,
            progressionData: auth.progressionData 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
