const jwt = require("jsonwebtoken");
require("dotenv").config();

const authToken = (req, res, next) => {
    const token = req.header("x-auth-token");

    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

module.exports = authToken;