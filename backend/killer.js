const { exec } = require('child_process');

console.log("Attempting to kill port 5000...");

exec('fuser -k -9 5000/tcp', (err, stdout, stderr) => {
    if (err) {
        console.error("fuser failed:", err);
        // Fallback
        exec('lsof -t -i:5000 | xargs kill -9', (err2, out2, stderr2) => {
            console.log("fallback kill done", out2, stderr2);
        });
    } else {
        console.log("fuser success:", stdout);
    }
});
