const jwt = require("jsonwebtoken");
const http = require('http');

const secret = "itam_secret_key_2024";
const token = jwt.sign({ id: 1, role: 'admin' }, secret);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/entities',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);
    res.on('data', (c) => data += c);
    res.on('end', () => console.log('Response length:', data.length, 'Data:', data.slice(0, 100)));
});
req.end();
