const cds = require("@sap/cds");
const bcrypt = require("bcryptjs");
const { generateAccessToken, generateRefreshToken } = require("../helpers/jwt");

const { Users } = cds.entities;

const authHandler = {
  login: async (req) => {
    const user = await SELECT.from(Users).where({
      username: req.data.username,
    });
    if (!user || user.length !== 1)
      return req.reject(401, "Invalid username or password");

    if (!(req.data.password === user[0].password)) {
      return req.reject(401, "Invalid password");
    }
    const accessToken = generateAccessToken(user[0]);
    const refreshToken = generateRefreshToken(user[0]);

    const updatedUser = await UPDATE(Users)
      .where({ ID: user[0].ID })
      .set({ refreshToken: refreshToken });
    if (!updatedUser) {
      return req.reject(500, "Failed to update the user's token.");
    }
    return req.info(200, accessToken);
  },

  signup: async (req) => {
    const user = await SELECT.from(Users).where({
      username: req.data.username,
    });

    if (user.length > 0)
      return req.reject(400, "This username is already existed");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.data.password, salt);

    await INSERT.into(Users).entries({
      fname: req.data.fname,
      address: req.data.address,
      username: req.data.username,
      password: hashedPassword,
      role: req.data.role ? req.data.role : "staff",
    });
    const newUser = await SELECT.one.from(Users).where({ username: req.data.username });
    if (!newUser) {
      return req.reject(500, "Failed to retrieve user information after signup.");
  }
    await calculateVacationDays(newUser.ID);
    return req.info(200, "Welcome to the system!");
  },

 


};

const calculateVacationDays = async (user_id) => {
  try {
    const user = await SELECT.one.from(Users).where({ ID: user_id });
    const createdAt = new Date(user.createdAt);
    const currentYear = new Date().getFullYear();
    if (createdAt.getFullYear() === currentYear) {
      const endOfYear = new Date(currentYear, 11, 31);
      const monthsPassed = endOfYear.getMonth() - createdAt.getMonth();
      const dayOffThisYear = monthsPassed * 1.25;
      await UPDATE(Users).set({ dayOffThisYear: dayOffThisYear }).where({ ID: user_id });
    }
  } catch (error) {
    return { code: 500, message: error.message || "Internal Server Error" };
  }
};

module.exports = authHandler;
