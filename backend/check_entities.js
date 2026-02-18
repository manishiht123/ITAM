const { Sequelize } = require("sequelize");
const config = require("./src/config/db");
const Entity = require("./src/models/Entity");

async function checkEntities() {
    try {
        await require("./src/config/db").authenticate();
        const entities = await Entity.findAll();
        console.log("Entities found:", JSON.stringify(entities, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkEntities();
