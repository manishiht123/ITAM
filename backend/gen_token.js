const jwt = require("jsonwebtoken");
console.log(jwt.sign({ id: 1 }, process.env.JWT_SECRET || "itam_secret_key_2024", { expiresIn: "1h" }));
