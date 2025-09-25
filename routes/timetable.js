// routes/timetable.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getAuth } = require('../modules/login');

// Route to fetch timetable using stored cookie and progression data
router.post('/get', async (req, res) => {
    let { accountId, start, end } = req.body;
    
    accountId = accountId.toLowerCase(); // normalize

    try {
        // Get user auth data from MongoDB
        const authData = await getAuth(accountId);
        
        if (!authData) {
            console.warn(`[Timetable] No auth data found for account: ${accountId}`);
            return res.status(400).json({ error: 'No auth data found for this account' });
        }

        const { cookie, progressionData: progData } = authData;

        if (!progData) {
            console.warn(`[Timetable] No progression data found for account: ${accountId}`);
            return res.status(400).json({ error: 'No progression data found for this account' });
        }

        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localDate = `${year}-${month}-${day}`;

        const payload = {
            PrID: progData.PrID,
            CrID: progData.CrID,
            AcYr: progData.AcYr,
            DeptID: progData.DeptID,
            SemID: progData.SemID,
            start: localDate,
            end: localDate,
            usrTime: new Date().toLocaleString('en-GB', { hour12: true }),
            schdlTyp: "slctdSchdl",
            isShowCancelledPeriod: true,
            isFromTt: true
        };
        
        console.log(`[Timetable] Fetching timetable for account: ${accountId} with payload:`, payload);

        const response = await axios.post(
            'https://student.bennetterp.camu.in/api/Timetable/get',
            payload,
            {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
                    'appversion': 'v2',
                    'clienttzofst': '330',
                    'content-type': 'application/json',
                    'origin': 'https://student.bennetterp.camu.in',
                    'referer': 'https://student.bennetterp.camu.in/v2/timetable',
                    'user-agent': 'Mozilla/5.0',
                    'Cookie': cookie
                }
            }
        );

        res.json(response.data);
    } catch (err) {
        console.error('[Timetable] Error:', err.message);
        
        if (err.response) {
            console.error('[Timetable] Response data:', err.response.data);
            console.error('[Timetable] Status code:', err.response.status);
        }
        
        res.status(500).json({ 
            error: 'Failed to fetch timetable', 
            details: err.message 
        });
    }
});

module.exports = router;