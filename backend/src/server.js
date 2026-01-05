const app = require("./app");
const sequelize = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 5000;

const waitForDB = async () => {
  let retries = 10;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log("MySQL connected");
      return;
    } catch (err) {
      retries -= 1;
      console.log(`Waiting for MySQL... retries left: ${retries}`);
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error("MySQL connection failed");
};

const startServer = async () => {
  try {
    await waitForDB();
    await sequelize.sync({ alter: true });

    const admin = await User.findOne({
      where: { email: "manish@ofbusiness.in" }
    });

    if (!admin) {
      await User.create({
        name: "Admin",
        email: "manish@ofbusiness.in",
        password: await bcrypt.hash("Admin@123@", 10),
        role: "admin"
      });
      console.log("Default admin created: manish@ofbusiness.in / Admin@123@");
    }

    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();

