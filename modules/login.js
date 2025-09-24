const axios = require('axios');
const fs = require('fs');
const path = require('path');

const COOKIE_PATH = path.join(__dirname, '../cookies.json');

// Save auth info for a specific email, keeping existing ones
function saveAuth(email, cookie, progressionData, stuid) {
    const normalizedEmail = email.toLowerCase(); // normalize
    let allAuth = {};
    if (fs.existsSync(COOKIE_PATH)) {
        allAuth = JSON.parse(fs.readFileSync(COOKIE_PATH));
    }

    // Only save if email doesn't already exist
    if (!allAuth[normalizedEmail]) {
        allAuth[normalizedEmail] = {
            cookie,
            progressionData,
            stuid
        };
        fs.writeFileSync(COOKIE_PATH, JSON.stringify(allAuth, null, 2));
        console.log(`Auth saved for ${normalizedEmail}`);
    } else {
        console.log(`Auth for ${normalizedEmail} already exists. Not updating cookies.`);
    }
}

// Get stored auth info for specific email
function getAuth(email) {
    const normalizedEmail = email.toLowerCase(); // normalize
    if (fs.existsSync(COOKIE_PATH)) {
        const allAuth = JSON.parse(fs.readFileSync(COOKIE_PATH));
        const auth = allAuth[normalizedEmail];
        if (auth) {
            // Return cookie, progressionData, and stuid
            return {
                cookie: auth.cookie,
                progressionData: auth.progressionData,
                stuid: auth.stuid
            };
        }
    }
    return null;
}

// Login function
async function login(email, password) {
    const normalizedEmail = email.toLowerCase(); // normalize

    // Check if email already has auth stored
    const existingAuth = getAuth(normalizedEmail);
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

        if (!progression) throw new Error('No progression data found');
        if (!stuid) throw new Error('No StuID found');

        const progressionData = {
            PrID: progression.PrID,
            CrID: progression.CrID,
            AcYr: progression.AcYr,
            DeptID: progression.DeptID,
            SemID: progression.SemID
        };

        saveAuth(normalizedEmail, cookieStr, progressionData, stuid);

        return { cookie: cookieStr, progressionData, stuid };

    } catch (err) {
        console.error(`Login failed for ${normalizedEmail}:`, err.message);
        throw err;
    }
}

module.exports = { login, getAuth };
