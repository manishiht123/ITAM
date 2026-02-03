const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const parseField = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.headers["x-forwarded-for"] || req.ip || req.connection?.remoteAddress;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      try {
        await AuditLog.create({
          user: email || "Unknown",
          action: "Login failed",
          ip,
          details: "User not found"
        });
      } catch (err) {
        console.error("Audit log failed:", err.message);
      }
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      try {
        await AuditLog.create({
          user: user.email || user.name || "Unknown",
          action: "Login failed",
          ip,
          details: "Invalid credentials"
        });
      } catch (err) {
        console.error("Audit log failed:", err.message);
      }
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);
    try {
      await AuditLog.create({
        user: user.email || user.name || "Unknown",
        action: "Login successful",
        ip,
        details: `Role: ${user.role}`
      });
    } catch (err) {
      console.error("Audit log failed:", err.message);
    }

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        allowedEntities: parseField(user.allowedEntities, []),
        entityPermissions: parseField(user.entityPermissions, {})
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
