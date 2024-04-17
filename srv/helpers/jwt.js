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
    { expiresIn: "30m" }

  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.ID,
      role: user.role,
    },
    refreshTokenKey,
    { expiresIn: "30d" }
  );
};

const verifyAccessToken = (token) => {
  if (!token) return;
  const accessToken = token.split(" ")[1];
  if (!accessToken) return;
  try {
 
    const decoded = jwt.verify(accessToken, accessTokenKey);
    return decoded;
  } catch (err) {
    const decoded = jwt.decode(accessToken);
    return {
      id: decoded.id,
    };
  }
};
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, refreshTokenKey);
    return decoded;
  } catch (err) {
    const decoded = jwt.decode(token);
    return {
      id: decoded.id,
    };
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
