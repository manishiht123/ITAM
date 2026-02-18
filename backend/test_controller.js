const entityController = require('./src/controllers/entityController');
const Entity = require('./src/models/Entity');

async function testController() {
    try {
        await require('./src/config/db').authenticate();
        const req = { user: { role: 'admin' } };
        const res = {
            json: (data) => console.log("JSON Response:", JSON.stringify(data, null, 2)),
            status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) })
        };
        await entityController.getEntities(req, res);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

testController();
