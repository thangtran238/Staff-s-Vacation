const cds = require("@sap/cds");
const { verifyAccessToken } = require("./helpers/jwt");
module.exports = async (srv) => {

  const { Users, Requests } = cds.entities;

  srv.before("*", "Requests", async (req) => {
    
    const decoded = verifyAccessToken(req.headers.authorization);
    if (!decoded) return req.reject(402, "Your token is expired");

    const user = await SELECT.from(Users).where({ ID: decoded.id });

    if (!user) return req.reject(404, "User not found!");

    req.data.user_ID = decoded.id;
  });

  srv.on("UPDATE", "Request", async (req) => {

    const requireAbsence = await SELECT("*")
      .from(Requests)
      .where({ ID: req.params }, { status: "pending" });

    if (requireAbsence.length === 0)
      return req.reject(404, "Couldn't find this request!!!");
  });
};
