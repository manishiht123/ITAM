const { Sequelize } = require("sequelize");
const config = require("./src/config/db");
const User = require("./src/models/User");

async function checkUser() {
    try {
        await require("./src/config/db").authenticate();
        const user = await User.findOne({ where: { email: "manish@ofbusiness.in" } });
        console.log("User found:", JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkUser();
