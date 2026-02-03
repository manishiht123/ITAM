const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "itamdb",
  process.env.DB_USER || "itamuser",
  process.env.DB_PASSWORD || "itam@123",
  {
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql",
    port: 3306,
    logging: false,
    retry: {
      max: 10
    }
  }
);

module.exports = sequelize;

