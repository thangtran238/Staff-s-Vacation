const cds = require("@sap/cds");
const { Users, Requests } = cds.entities;
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
              colUser("fname"),
              colUser("address"),
              colUser("department_id");
          });
      })
      .where("user.department_id", "=", manager.department_id);
    if (requests.length === 0)
      return req.info(202, "There aren't any request yet!");
    req.results = { code: 200, message: requests };
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
              colUser("fname"),
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

  update: async (req) => {
    const request = await SELECT.one
      .from(Requests)
      .where({ ID: req.data.request });
    if (!request) return req.reject(404, "Couldn't find this request");
    if (request.status !== "pending")
      return req.reject(400, `You have ${request.status} this request!!!`);
    const manager = await SELECT.one
      .from(Users)
      .where({ ID: req.data.authentication.id });
    const user = await SELECT.one.from(Users).where({ ID: request.user_ID });

    if (manager.department_id !== user.department_id)
      return req.reject(402, "Your are not the manager of this request!!!");

    let startDay = new Date(request.startDay);
    let endDay = new Date(request.endDay);
    const days = getAllDaysBetween(startDay, endDay).length;

    startDay = new Date(request.startDay);
    endDay = new Date(request.endDay);
    console.log(startDay);
    console.log(endDay);
    const startDayMonth = startDay.getMonth();
    const endDayMonth = endDay.getMonth();

    if (startDayMonth >= 3) user.dayOffLastYear = 0;

    if (!user.dayOffLastYear) {
      await UPDATE(Users)
        .where({ ID: request.user_ID })
        .set({ dayOffLastYear: 0, dayOffThisYear: { "-=": days } });
    } else {
      if (startDayMonth < 3 && endDayMonth == 3) {
        const { daysBeforeApril, daysAfterApril } = getDaysBeforeAfterApril(
          startDay,
          endDay
        );
        console.log(daysBeforeApril, daysAfterApril);
        // se lay so du cua ngay nghi thang 3 - di cho ngay nghi nam ngoai
        const newDayOffLastYear = user.dayOffLastYear - daysBeforeApril;
        console.log(newDayOffLastYear);
        await UPDATE(Users)
          .set({ dayOffThisYear: { "-=": daysAfterApril } })
          .where({ ID: user.ID });
        if (newDayOffLastYear > 0)
          await UPDATE(Users)
            .set({ dayOffLastYear: newDayOffLastYear })
            .where({ ID: user.ID });
        if (newDayOffLastYear == 0)
          await UPDATE(Users)
            .set({
              dayOffLastYear: newDayOffLastYear,
            })
            .where({ ID: user.ID });
        if (newDayOffLastYear < 0) {
          await UPDATE(Users)
            .set({
              dayOffLastYear: 0,
              dayOffThisYear: { "+=": newDayOffLastYear },
            })
            .where({ ID: user.ID });
        }
      } else {
        const newDayOffLastYear = user.dayOffLastYear - days;
        console.log(newDayOffLastYear);
        if (newDayOffLastYear > 0)
          await UPDATE(Users)
            .set({
              dayOffLastYear: { "-=": days },
            })
            .where({ ID: user.ID });
        if (newDayOffLastYear == 0)
          await UPDATE(Users)
            .set({
              dayOffLastYear: { "-=": days },
            })
            .where({ ID: user.ID });
        if (newDayOffLastYear < 0)
          await UPDATE(Users)
            .set({
              dayOffLastYear: 0,
              dayOffThisYear: { "+=": newDayOffLastYear },
            })
            .where({ ID: user.ID });
      }

      // await cds
      //   .update(Requests)
      //   .set({ status: req.data.action })
      //   .where({ ID: req.data.request });
      // const updatedRequest = await SELECT.one
      //   .from(Requests)
      //   .where({ ID: req.data.request });

      // req.results = {
      //   code: 200,
      //   action: req.data.action,
      //   data: updatedRequest,
      // };
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
  console.log(days);
  return days;
};

const getDaysBeforeAfterApril = (startDay, endDay) => {
  let daysBeforeApril = 0;
  let daysAfterApril = 0;

  for (let date = startDay; date <= endDay; date.setDate(date.getDate() + 1)) {
    if (date.getMonth() < 3) {
      daysBeforeApril++;
    } else if (date.getMonth() === 3) {
      daysAfterApril++;
    } else {
      daysAfterApril++;
    }
  }
  return { daysBeforeApril, daysAfterApril };
};

module.exports = managerHandler;
