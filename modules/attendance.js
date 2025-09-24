const express = require('express');
const fs = require('fs').promises;
const fetch = require('node-fetch');
const path = require('path');

const router = express.Router();

// The endpoint to mark attendance for all users
router.post('/mark-all-present', async (req, res) => {
    // 1. Get the attendanceId from the frontend request body
    const { attendanceId } = req.body;

    if (!attendanceId) {
        return res.status(400).json({ error: 'attendanceId is required in the request body.' });
    }

    // 2. Read the cookie.json file
    let cookieData;
    try {
        const data = await fs.readFile(path.join(__dirname, '../cookies.json'), 'utf8');
        cookieData = JSON.parse(data);
    } catch (error) {
        console.error('Error reading or parsing cookie.json:', error);
        return res.status(500).json({ error: 'Failed to read user data. Check if cookie.json exists and is valid.' });
    }

    // 3. Prepare an array to store the results of each API call
    const results = [];
    const userEmails = Object.keys(cookieData);

    // 4. Use Promise.all to send all requests concurrently
    const promises = userEmails.map(async (email) => {
        const user = cookieData[email];
        const { cookie, stuid } = user;

        const requestBody = {
            "attendanceId": attendanceId,
            "StuID": stuid,
            "offQrCdEnbld": true,
            "isBatchClass": false
        };

        const apiUrl = 'https://student.bennetterp.camu.in/api/Attendance/record-online-attendance';
        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8',
            'User-Agent': 'MyCamu/2 CFNetwork/1568.100.1.2.1 Darwin/24.0.0',
            'Token': '23hg87klh980nxcgjuyY',
            'Cache-Control': 'no-cache',
            'Host': 'student.bennetterp.camu.in',
            'Cookie': cookie
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
                timeout: 30000
            });

            const responseData = await response.json().catch(() => ({}));

            results.push({
                email,
                status: response.status,
                message: response.statusText,
                data: responseData,
                success: response.ok
            });
            console.log(`Attendance marked for ${email}. Status: ${response.status}`);

        } catch (error) {
            console.error(`Error marking attendance for ${email}:`, error);
            results.push({
                email,
                status: 'Error',
                message: error.message,
                data: null,
                success: false
            });
        }
    });

    await Promise.all(promises);

    res.status(200).json({
        message: 'Attendance marking process completed.',
        summary: results
    });
});

module.exports = router;
