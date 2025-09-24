const https = require('https');
const fs = require('fs');

// Configuration
const config = {
  hostname: 'student.bennetterp.camu.in',
  port: 443,
  path: '/api/Attendance/record-online-attendance',
  method: 'POST',
  headers: {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8',
    'User-Agent': 'MyCamu/2 CFNetwork/1568.100.1.2.1 Darwin/24.0.0',
    'Token': '23hg87klh980nxcgjuyY',
    'Cache-Control': 'no-cache',
    'Cookie': 'connect.sid=s%3AO8RR8KCtS_5VVsuYTh8CWW6CXn0VkoE2.kCTMHYol6NdVwRIoRn76NVBpu0ZheacIN0dPyAbG9Jg',
    'Host': 'student.bennetterp.camu.in'
  }
};

// Request body
const requestBody = {
  "attendanceId": "68d26680e00242880f82fe41_68d26a330ada8529e692b517",
  "StuID": "668c1a08b26adcc7e79eaefa",
  "offQrCdEnbld": true,
  "isBatchClass": false
};

const bodyString = JSON.stringify(requestBody);
config.headers['Content-Length'] = Buffer.byteLength(bodyString);

// Logging function
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Also write to file
  fs.appendFileSync('attendance_request.log', logMessage + '\n');
  if (data) {
    fs.appendFileSync('attendance_request.log', JSON.stringify(data, null, 2) + '\n');
  }
}

// Function to send the request
function sendAttendanceRequest() {
  log('Starting attendance request...');
  log('Request Configuration:', {
    url: `https://${config.hostname}${config.path}`,
    method: config.method,
    headers: config.headers,
    body: requestBody
  });

  const req = https.request(config, (res) => {
    log(`Response Status: ${res.statusCode} ${res.statusMessage}`);
    log('Response Headers:', res.headers);

    let responseBody = '';

    // Handle different encodings
    if (res.headers['content-encoding'] === 'gzip') {
      const zlib = require('zlib');
      const gunzip = zlib.createGunzip();
      res.pipe(gunzip);
      
      gunzip.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      gunzip.on('end', () => {
        handleResponse(res.statusCode, responseBody);
      });
      
      gunzip.on('error', (err) => {
        log('Gunzip Error:', err);
      });
    } else {
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        handleResponse(res.statusCode, responseBody);
      });
    }
  });

  // Handle request errors
  req.on('error', (error) => {
    log('Request Error:', error);
  });

  // Handle timeout
  req.setTimeout(30000, () => {
    log('Request Timeout: No response received within 30 seconds');
    req.destroy();
  });

  // Send the request body
  log('Sending request body:', bodyString);
  req.write(bodyString);
  req.end();
}

// Function to handle response
function handleResponse(statusCode, body) {
  log(`Response received. Status: ${statusCode}`);
  
  try {
    const parsedBody = JSON.parse(body);
    log('Parsed Response Body:', parsedBody);
  } catch (e) {
    log('Response Body (Raw):', body);
    log('JSON Parse Error:', e.message);
  }

  // Status code analysis
  if (statusCode === 200) {
    log('✅ SUCCESS: Request completed successfully');
  } else if (statusCode === 500) {
    log('❌ SERVER ERROR (500): Internal server error occurred');
  } else if (statusCode === 401) {
    log('❌ UNAUTHORIZED (401): Check token or authentication');
  } else if (statusCode === 403) {
    log('❌ FORBIDDEN (403): Access denied');
  } else {
    log(`❌ ERROR (${statusCode}): Unexpected status code`);
  }
}

// Alternative implementation using axios (if you prefer)
function sendWithAxios() {
  const axios = require('axios');
  
  const axiosConfig = {
    method: 'POST',
    url: `https://${config.hostname}${config.path}`,
    headers: config.headers,
    data: requestBody,
    timeout: 30000,
    validateStatus: function (status) {
      return true; // Don't throw on any status code
    }
  };

  log('Sending request with Axios...');
  log('Axios Config:', axiosConfig);

  axios(axiosConfig)
    .then(response => {
      log(`Axios Response Status: ${response.status}`);
      log('Axios Response Headers:', response.headers);
      log('Axios Response Data:', response.data);
    })
    .catch(error => {
      log('Axios Error:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      });
    });
}

// Clear previous log file
if (fs.existsSync('attendance_request.log')) {
  fs.unlinkSync('attendance_request.log');
}

log('=== Attendance API Request Test Started ===');

// Send the request
sendAttendanceRequest();

// Uncomment below if you want to also try with axios
// Make sure to install axios first: npm install axios
// setTimeout(() => {
//   log('\n=== Trying with Axios ===');
//   sendWithAxios();
// }, 2000);

log('Request sent. Check console and attendance_request.log file for detailed logs.');