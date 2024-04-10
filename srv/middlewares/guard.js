const cds = require("@sap/cds");
const { verifyAccessToken } = require("../helpers/jwt");

const { Users } = cds.entities;

const guard = {
  authentication: async (req) => {
    const decoded = verifyAccessToken(req.headers.authorization);
    if (!decoded) return req.reject(402, "Your token is expired");

    const tx = cds.transaction(req);

    const user = await tx.run(SELECT.from(Users).where({ ID: decoded.id }));

    if (user.length === 0) return req.reject(404, "User not found!");

    req.data.authentication = {
      id: decoded.id,
      role: decoded.role,
    };
  },

  managerAuthorization: async (req) => {
    await guard.authentication(req); 
    const { authentication } = req.data;
    if (authentication.role !== "manager")
      return req.reject(403, "You're not the manager!");
  },
};

module.exports = guard;
