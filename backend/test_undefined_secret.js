const jwt = require("jsonwebtoken");
const token = jwt.sign({ id: 1 }, undefined);
console.log("Token:", token);

const http = require('http');

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
    res.on('end', () => console.log('Response:', data));
});
req.end();
