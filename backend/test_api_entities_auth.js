const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/entities',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzcxMzExOTMzLCJleHAiOjE3NzEzMTU1MzN9.mAxaC4w6lrqCEO7kpyvlL9ZR3-8UlmRQcIAZ2AP0w5c'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log('Raw Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
