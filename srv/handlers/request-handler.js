const cds = require("@sap/cds");
const cron = require("node-cron");
const { SELECT, UPDATE, INSERT } = cds.ql;
const { Users, Requests } = cds.entities;
const requestHandler = {
  getRequests: async (req) => {
    const requests = await SELECT.from(Requests)
      .columns((col) => {
        col("ID"),
          col("status"),
          col("reason"),
          col("startDay"),
          col("endDay"),
          col.user((colUser) => {
            colUser("ID"),
              colUser("fullName"),
              colUser("address"),
              colUser("department_id");
          });
      })
      .where("user.ID", "=", req.data.authentication.id)
      .and(req.data.request ? { ID: req.data.request } : "");

    if (requests.length === 0) {
      return req.info(202, "We can't find any request!");
    }
    return (req.results = { code: 200, message: requests });
  },

  create: async (req) => {
    const user = await SELECT.one
    .from(Users)
    .where({ ID: req.data.authentication.id });
    if(user.department_id == null || undefined){
      req.reject(400,"You haven't joined any faction yet.")
    };
    const messaging = await cds.connect.to("messaging");
    const startDay = new Date(req.data.startDay);
    const endDay = new Date(req.data.endDay);
    const currentDate = new Date();

    const requests = await SELECT.from(Requests).where({
      user_ID: req.data.authentication.id,
      status: "pending",
    });
    if (requests.length > 0)
      return req.reject(
        400,
        "You already have a pending request, let the manager accept it first!!"
      );
    if (startDay < currentDate || endDay < currentDate) {
      return req.reject(
        400,
        "Start day and end day must be after the current date."
      );
    } else if (endDay < startDay) {
      return req.reject(400, "End day must be after start day.");
    }

    const daysOff = getAllDaysBetween(startDay, endDay).length;

    if (daysOff > user.dayOffThisYear + user.dayOffLastYear) {
      await INSERT.into(Requests).entries({
        reason: req.data.reason,
        startDay: req.data.startDay,
        endDay: req.data.endDay,
        isOutOfDay: true,
        user_ID: req.data.authentication.id,
      });
    } else {
      await INSERT.into(Requests).entries({
        reason: req.data.reason,
        startDay: req.data.startDay,
        endDay: req.data.endDay,
        user_ID: req.data.authentication.id,
      });
    }

    const request = await SELECT.one
      .from(Requests)
      .where({
        reason: req.data.reason,
        startDay: req.data.startDay,
        endDay: req.data.endDay,
        user_ID: req.data.authentication.id,
      })
      .orderBy("createdAt desc");
    await messaging.emit("notify", {
      code: 200,
      action: "new",
      data: request,
      authentication: req.data.authentication,
    });

    req.results = {
      code: 200,
      action: "new",
      data: request,
    };
  },

  update: async (req) => {
    try {
      const currentDate = new Date();
      const findRequest = await SELECT.one
        .from(Requests)
        .where({ ID: req.data.ID });
      if (!findRequest) {
        return req.reject(404, "Couldn't find this request to update.");
      }
      if  (findRequest.status !== "pending") {
        return req.reject(403, "Cannot update request");
      }
      if  (req.data.startDay < currentDate || req.data.endDay < currentDate) {
        return req.reject(
          400,
          "Start day and end day must be after the current date."
        );
      } 
      else if (req.data.endDay < req.data.startDay) {
        return req.reject(400, "End day must be after start day.");
      }else if (req.data.startDay > findRequest.endDay) {
        return req.reject(400, "Input start day invalid");
      }
      else if (req.data.endDay < findRequest.startDay) {
        return req.reject(400, "Input end day invalid");
      }

      const updateData = {};
      if (req.data.reason !== undefined && req.data.reason !== null) {
        updateData.reason = req.data.reason;
      }
      if (req.data.startDay !== undefined && req.data.startDay !== null) {
        updateData.startDay = req.data.startDay;
      }
      if (req.data.endDay !== undefined && req.data.endDay !== null) {
        updateData.endDay = req.data.endDay;
      }
  
      if (Object.keys(updateData).length === 0) {
        return req.reject(400, "No valid fields provided for update.");
      }
  
      await cds
        .update(Requests)
        .set(updateData)
        .where({ ID: req.data.ID });
  
      return req.info(200, `Update successful`);
    } catch (error) {
      console.error("Error occurred during request update:", error);
      return req.reject(
        error.status || 500,
        error.message || "Internal Server Error"
      );
    }
  },

  remove: async (req) => {
    try {
      const findRequest = await SELECT.one
        .from(Requests)
        .where({ ID: req.data.ID });
      if (!findRequest) {
        return req.reject(404, "Request not found");
      }
      if (findRequest.status !== "pending") {
        return req.reject(403, "Cannot delete request");
      }
      await cds.run(DELETE.from(Requests).where({ ID: req.data.ID }));
      return req.info(200, `delete successfully !`);
    } catch (error) {
      console.error("Error occurred during request deletion:", error);
      return req.reject(
        error.status || 500,
        error.message || "Internal Server Error"
      );
    }
  },
  recalculateVacationDays: async () => {
    try {
      const allUsers = await SELECT.from(Users);
      for (const user of allUsers) {
        let dayOffThisYear = user.dayOffThisYear;
        let dayOffLastYear = user.dayOffLastYear;
        if (dayOffThisYear === 0) {
          dayOffLastYear = 0;
          dayOffThisYear = 12 * 1.25;
        } else if (dayOffThisYear > 0 && dayOffThisYear <= 5) {
          dayOffLastYear = dayOffThisYear;
          dayOffThisYear = 12 * 1.25;
        } else if (dayOffThisYear > 5) {
          dayOffLastYear = 5;
          dayOffThisYear = 12 * 1.25;
        }
        await UPDATE(Users)
          .set({ dayOffThisYear, dayOffLastYear })
          .where({ ID: user.ID });

      }
    } catch (error) {
      return { status: 500, message: error };
    }
  },

  refreshDayOffLastYear: async () => {
    try {
      const allUsers = await SELECT.from(Users);
      for (const user of allUsers) {
        await UPDATE(Users).set({ dayOffLastYear: 0 }).where({ ID: user.ID });
      }
    } catch (error) {
      return { status: 500, message: error };
    }
  },
};



const getAllDaysBetween = (startDay, endDay) => {
  const days = [];
  let currentDate = new Date(startDay);
  for (
    let date = currentDate;
    date <= endDay;
    date.setDate(date.getDate() + 1)
  ) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
  }
  return days;
};


cron.schedule("59 23 31 3 *", async () => {
  await requestHandler.refreshDayOffLastYear();
  return req.info(200, "refresh DayOffLastYear successfully.");
});

cron.schedule("59 23 31 12 *", async () => {
  await requestHandler.recalculateVacationDays();
  return req.info(200, "Vacation days recalculated successfully.");
});

module.exports = requestHandler;
