const jwt = require("jsonwebtoken");
const env = require("dotenv");

env.configDotenv();
const accessTokenKey = process.env.ACCESS_TOKEN;
const refreshTokenKey = process.env.REFRESH_TOKEN;

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.ID,
      role: user.role,
    },
    accessTokenKey,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.ID,
      role: user.role,
    },
    refreshTokenKey,
    { expiresIn: "1h" }
  );
};

const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    return decoded;
  } catch (err) {
    const decoded = jwt.decode(token);
    return {
      id: decoded.id,
      exp: decoded.exp,
    };
  }
};

const verifyRefreshToken = (token) => {
  try {
    const secret = refreshTokenKey;
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (err) {
    console.log(err);

    return {
      expired: true,
    };
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
