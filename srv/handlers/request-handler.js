const cds = require("@sap/cds");
const { SELECT, UPDATE, INSERT } = cds.ql;
const {Users,Requests} =  cds.entities
const requestHandler = {
  create: async (req) => {
    try {
      const startDay = new Date(req.data.startDay);
      const endDay = new Date(req.data.endDay);
      const currentDate = new Date();
      if (startDay < currentDate || endDay < currentDate) {
        return req.reject(
          400,
          "Start day and end day must be after the current date."
        );
      }
      if (endDay <= startDay) {
        return req.reject(400, "End day must be after start day.");
      }


      ///////////////////////////////
      const user = await SELECT.one.from(Users).where({ ID: req.data.authentication.id });
      console.log(user);
      const createdAt = new Date(user.createdAt);
      const currentYear = new Date().getFullYear();
      if (createdAt.getFullYear() === currentYear) {
        const endOfYear = new Date(currentYear, 11, 31);
        const monthsPassed = (endOfYear.getFullYear() - createdAt.getFullYear()) * 12 + (endOfYear.getMonth() - createdAt.getMonth());
        const totalDaysOff = monthsPassed * 1.25;
        await UPDATE(Users).set({ totalDayOff : totalDaysOff }).where({ ID: req.data.authentication.id });
      } 
      else {
        const reqCurrentUser = await SELECT.from(Requests).where({ user_ID: user.ID });
        let totalDaysOff = 0;
        for (const req of reqCurrentUser) {
          const startDate = new Date(req.startDay);
          const endDate = new Date(req.endDay);
          const daysOff = (endDate - startDate) / (1000 * 3600 * 24);
          totalDaysOff += daysOff;
        }
        await UPDATE(Users).set({ totalDaysOff: totalDaysOff }).where({ ID: req.data.authentication.id });
      }
     //////////////////////////////////////
         await INSERT.into(Requests).entries({
        reason: req.data.reason,
        startDay: req.data.startDay,
        endDay: req.data.endDay,
        user_ID: req.data.authentication.id
      });
    } catch (error) {
      req.error({
        code: error.code || 500,
        message: error.message || "Internal Server Error",
      });
    }
  },
  update: async (req) => {
    try {
      const findRequest = await SELECT.one.from(Requests).where({ ID: req.data.ID });
      if (!findRequest) {
        return req.reject(404, "Couldn't find this request to update.");
      }
      if (findRequest.status !== "pending") {
        return req.reject(403, "Cannot update request");
      }
    } catch (error) {
      console.error("Error occurred during request update:", error);
      return req.reject(error.status || 500, error.message || "Internal Server Error");
    }
  },

  remove: async (req) => {
    try {
      const findRequest = await SELECT.one.from(Requests).where({ ID: req.data.ID });
      if (!findRequest) {
        return req.reject(404, "Request not found");
      }
      if (findRequest.status !== "pending") {
        return req.reject(403, "Cannot delete request");
      }
    } catch (error) {
      console.error("Error occurred during request deletion:", error);
      return req.reject(error.status || 500, error.message || "Internal Server Error");
    }
  },
};

const roleChecking = (role) => {
  return role === "staff";
};

module.exports = requestHandler;
