const cds = require("@sap/cds");
const bcrypt = require("bcryptjs");

const connection = require("./helpers/db");
const { generateAccessToken, generateRefreshToken } = require("./helpers/jwt");

module.exports = async (srv) => {
  const db = await connection();
  const { Users } = srv.entities;

  srv.on("login", async (req) => {
    const user = await db.read(Users).where({ username: req.data.username });
    if (!user || user.length !== 1)
      return req.reject(401, "Invalid username or password");

    if (!await bcrypt.compare(req.data.password,user[0].password)) {
      return req.reject(401, "Invalid password");
    }
    const accessToken = generateAccessToken(user[0]);
    const refreshToken = generateRefreshToken(user[0]);

    const updatedUser = await db
      .update(Users)
      .where({ ID: user[0].ID })
      .set({ refreshToken: refreshToken });
    console.log(updatedUser);
    if (!updatedUser) {
      return req.reject(500, "Failed to update the user's token.");
    }
    return accessToken;
  });
};
