const { verifyAccessToken } = require("./helpers/jwt");

module.exports = (srv) => {
  const { Requests } = cds.entities("vacation");
  srv.before("*", "Requests", async (req) => {
    const decoded = verifyAccessToken(req.headers.authorization);
    if (!decoded) return req.reject(402, "Your token is expired");
    if (decoded.id !== undefined) {
      req.data.user_ID = decoded.id;
    } else {
      console.error("User ID is not available in the decoded token.");
    }
  });

  srv.before("UPDATE", "Requests", async (req) => {
    const { data } = req;
    try {
      const findRequest = await SELECT.one
        .from(Requests)
        .where({ ID: data.ID });
      if (!findRequest) {
        req.error({
          code: 404,
          message: "Request not found",
        });
        return;
      }

      if (findRequest.status !== "pending") {
        req.error({
          code: 403,
          message: "Cannot update request ",
        });
      }
    } catch (error){
        req.error({
          code:500,
          massage:error
        })
    }
  });

  srv.before("DELETE", "Requests", async (req) => {
    const { data } = req;
    try {
      const findRequest = await SELECT.one
        .from(Requests)
        .where({ ID: data.ID });
      if (!findRequest) {
        req.error({
          code: 404,
          message: "Request not found",
        });
        return;
      }

      if (findRequest.status !== "pending") {
        req.error({
          code: 403,
          message: "Cannot delete request ",
        });
      }
    } catch (error){
        req.error({
          code:500,
          massage:error
        })
    }
  });

};
