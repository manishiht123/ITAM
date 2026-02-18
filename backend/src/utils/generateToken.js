const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || "SUPERSECRETJWTKEY";
  return jwt.sign({ id, role }, secret, { expiresIn: "30d" });
};

module.exports = generateToken;
