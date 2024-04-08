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
    { expiresIn: "2h" }
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
  const accessToken = token.split(" ")[1]
  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
    return decoded
  } catch (err) {
    return
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
