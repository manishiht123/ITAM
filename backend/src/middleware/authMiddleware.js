const jwt = require("jsonwebtoken");
const User = require("../models/User");

const parseJsonField = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const data = user.toJSON();
    req.user = {
      ...data,
      allowedEntities: parseJsonField(data.allowedEntities, []),
      entityPermissions: parseJsonField(data.entityPermissions, {})
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
