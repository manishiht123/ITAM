const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "SUPERSECRETJWTKEY";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "30d" });
};

const generatePreAuthToken = (id, extra = {}) => {
  return jwt.sign({ id, ...extra }, JWT_SECRET, { expiresIn: "10m" });
};

module.exports = generateToken;
module.exports.generatePreAuthToken = generatePreAuthToken;
