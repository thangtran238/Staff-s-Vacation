const { verifyAccessToken } = require("./helpers/jwt");

module.exports = (srv) => {
  const { Users, Requests } = cds.entities("vacation");

  srv.before("*", async (req) => {
    const decoded = verifyAccessToken(req.headers.authorization);
    if (!decoded) return req.reject(402, "Your token is expired");

    const user = await SELECT.from(Users).where({ ID: decoded.id });
    if (user.length === 0) req.reject(404, "Couldn't find this user!!!");

    req.data.user_ID = decoded.id;
  });
  
  srv.before('CREATE','Requests',async(req)=>{
    const { data } = req;
    const user = await SELECT.one.from(Users).where({ID:data.user_ID});
    const createdAt = new Date(user.createdAt);
    const currentYear = new Date().getFullYear();
    if(createdAt.getFullYear === currentYear){
        const endOfYear = new Date(currentYear, 11, 31);
        const monthsPassed = (endOfYear.getFullYear() - createdAt.getFullYear()) * 12 + (endOfYear.getMonth() - createdAt.getMonth());
        const totalDaysOff = monthsPassed * 1.25;
        await UPDATE(Users).set({ totalDaysOff: totalDaysOff }).where({ ID: data.user_ID });
    }
    else{
        const reqCurrentUser = await SELECT.from.where({user:user});
        let totalDaysOff = 0;
        for (const req of reqCurrentUser) {
          const startDate = new Date(req.startDate);
          const endDate = new Date(req.endDate);
          const daysOff = (endDate - startDate) / (1000 * 3600 * 24);
          totalDaysOff += daysOff;
      }
      await UPDATE(Users).set({ totalDaysOff: totalDaysOff }).where({ ID: data.user_ID });
    }
    
  });


  srv.before("UPDATE", "Requests", async (req) => {
    try {
      const findRequest = await SELECT.one
        .from(Requests)
        .where({ ID: req.params });

      if (!findRequest) {
        console.log("Reject request");
        return req.reject({
          code: 404,
          message: "Couldn't find this request to update.",
        });
      }

      if (findRequest.status !== "pending") {
        console.log("Reject request due to status");
        return req.reject(403, "Cannot update request");
      }
    } catch (error) {
      console.error("Error occurred during request update:", error);
      return req.reject({
        code: 500,
        message: error.message,
      });
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
    } catch (error) {
      req.error({
        code: error.code,
        message: error.message,
      });
    }
  });
};
