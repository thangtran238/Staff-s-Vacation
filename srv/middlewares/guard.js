const cds = require("@sap/cds");
const { verifyAccessToken } = require("../helpers/jwt");

const { Users } = cds.entities;

const guard = {
  authentication: async (req) => {
    const decoded = verifyAccessToken(req.headers.authorization);
    if (!decoded) return req.reject(402, "Your token is expired");

    const user = await SELECT.from(Users).where({ ID: decoded.id });

    if (!user) return req.reject(404, "User not found!");

    req.data.authentication = {
      id: decoded.id,
      role: decoded.role,
    };
  },
};

module.exports = guard;
