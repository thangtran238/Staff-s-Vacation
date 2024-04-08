const cds = require("@sap/cds");
const { verifyAccessToken } = require("./helpers/jwt");
module.exports = async (srv) => {
  const { Requests } = cds.entities;

  srv.before("*", "Requests", async (req) => {
    const decoded = verifyAccessToken(req.headers.authorization);
    if (!decoded) return req.reject(402, "Your token is expired");
    if (decoded.id !== undefined) {
      req.data.user_ID = decoded.id;
    } else {
      req.error(404, "User ID is not available in the decoded token.");
    }
    if (decoded.role !== "manager") {
      req.reject(402, "You are not the manager!!!");
    }
  });

  srv.on("UPDATE", "Request", async (req) => {
    const requireAbsence = await SELECT("*")
      .from(Requests)
      .where({ ID: req.params }, { status: "pending" });
    if (!requireAbsence)
      return req.reject(404, "Couldn't find this request!!!");
  });
};
