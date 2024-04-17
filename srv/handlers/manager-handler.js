const cds = require("@sap/cds");

const { Calendar, Users, Requests } = cds.entities;
const managerHandler = {
  getRequests: async (req) => {
    const manager = await SELECT.one.from(Users).where({
      ID: req.data.authentication.id,
    });

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
      .where("user.department_id", "=", manager.department_id);

    if (requests.length === 0) {
      return req.info(202, "There aren't any request yet!");
    }
    return (req.results = { code: 200, message: requests });
  },

  getRequest: async (req) => {
    const manager = await SELECT.one.from(Users).where({
      ID: req.data.authentication.id,
    });

    const request = await SELECT.one
      .from(Requests)
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
      .where("user.department_id", "=", manager.department_id)
      .and({ ID: req.data.request });
    if (!request)
      return req.info(300, "There's something wrong, try again later!");
    req.results = { code: 200, message: request };
  },

  update: async (_, req) => {
    try {
      const messaging = await cds.connect.to("messaging");

      await cds
        .update(Requests)
        .set({ status: req.data.action, comment: req.data.comment })
        .where({ ID: req.data.request });
      const updatedRequest = await SELECT.one
        .from(Requests)
        .where({ ID: req.data.request });
      await messaging.emit("notifyManager", {
        code: 200,
        action: req.data.action,
        data: updatedRequest,
        authentication: req.data.authentication,
      });
      req.results = {
        code: 200,
        message: `You have ${req.data.action} request!`,
        data: updatedRequest,
      };
    } catch (error) {
      return _.error(500, error.message);
    }
  },
  calculatingDayOff: async (req) => {
    try {
      const { data } = req;
      const request = await SELECT.one
        .from(Requests)
        .where({ ID: data.request });
      if (!request) return req.reject(404, "Couldn't find this request");
      if (request.status !== "pending")
        return req.reject(400, `You have ${request.status} this request!!!`);
      const manager = await SELECT.one
        .from(Users)
        .where({ ID: req.data.authentication.id });
      const user = await SELECT.one.from(Users).where({ ID: request.user_ID });

      if (manager.department_id !== user.department_id)
        return req.reject(402, "Your are not the manager of this request!!!");

      let endDay = new Date(request.endDay + "T23:59:59Z");
      let startDay = new Date(request.startDay + "T00:00:00Z");

      const removeWeekend = getAllDaysBetween(startDay, endDay);
      const removeHoliday = await removeHolidays(removeWeekend);

      startDay = new Date(request.startDay + "T00:00:00Z");
      endDay = new Date(request.endDay + "T23:59:59Z");

      const startDayMonth = startDay.getMonth();
      const endDayMonth = endDay.getMonth();

      if (startDayMonth >= 3) user.dayOffLastYear = 0;

      if (!user.dayOffLastYear) {
        await UPDATE(Users)
          .where({ ID: request.user_ID })
          .set({
            dayOffLastYear: 0,
            dayOffThisYear: { "-=": removeHoliday.length },
          });
      } else {
        if (startDayMonth < 3 && endDayMonth == 3) {
          const { daysBeforeApril, daysAfterApril } =
            getDaysBeforeAfterApril(removeHoliday);
          const newDayOffLastYear = user.dayOffLastYear - daysBeforeApril;

          await UPDATE(Users)
            .set({ dayOffThisYear: { "-=": daysAfterApril } })
            .where({ ID: user.ID });

          if (newDayOffLastYear >= 0)
            await UPDATE(Users)
              .set({ dayOffLastYear: newDayOffLastYear })
              .where({ ID: user.ID });

          if (newDayOffLastYear < 0)
            await UPDATE(Users)
              .set({
                dayOffLastYear: 0,
                dayOffThisYear: { "+=": newDayOffLastYear },
              })
              .where({ ID: user.ID });
        } else {
          const newDayOffLastYear = user.dayOffLastYear - removeHoliday.length;

          if (newDayOffLastYear >= 0)
            await UPDATE(Users)
              .set({ dayOffLastYear: { "-=": removeHoliday.length } })
              .where({ ID: user.ID });

          if (newDayOffLastYear < 0)
            await UPDATE(Users)
              .set({
                dayOffLastYear: 0,
                dayOffThisYear: { "+=": newDayOffLastYear },
              })
              .where({ ID: user.ID });
        }
      }
    } catch (error) {
      return req.error(500, error.message);
    }
  },
};

const removeHolidays = async (offDays) => {
  const getHoliday = await SELECT.from(Calendar).where({
    startDay: { between: offDays[0], and: offDays[offDays.length - 1] },
    and: {
      endDay: { between: offDays[0], and: offDays[offDays.length - 1] },
    },
  });
  let totalHoliday = [];
  getHoliday.map((holiday) => {
    let endDay = new Date(holiday.endDay + "T23:59:59Z");
    let startDay = new Date(holiday.startDay + "T00:00:00Z");
    const holidayTerm = getAllDaysBetween(startDay, endDay);
    totalHoliday.push(...holidayTerm);
  });
  offDays = offDays.filter((day) => !totalHoliday.includes(day));

  return offDays;
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
  const weekDays = days.filter((day) => {
    const date = new Date(day);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  });
  return weekDays;
};

const getDaysBeforeAfterApril = (offDays) => {
  let daysBeforeApril = 0;
  let daysAfterApril = 0;
  const startDay = new Date(offDays[0] + "T00:00:00Z");
  const endDay = new Date(offDays[offDays.length - 1] + "T23:59:59Z");

  for (let date = startDay; date <= endDay; date.setDate(date.getDate() + 1)) {
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      if (date.getMonth() < 3) {
        daysBeforeApril++;
      } else if (date.getMonth() === 3) {
        daysAfterApril++;
      } else {
        daysAfterApril++;
      }
    }
  }
  return { daysBeforeApril, daysAfterApril };
};

module.exports = managerHandler;
