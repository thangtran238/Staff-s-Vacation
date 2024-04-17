const cds = require("@sap/cds");
const excelJS = require("exceljs");
const cron = require("node-cron");
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

  getRequestsForHr: async (req) => {
    try {
      const { nameStaff, date, department } = req.data;
      let query = SELECT.from(Requests).columns((col) => {
        col("ID"),
          col("status"),
          col("reason"),
          col("startDay"),
          col("endDay"),
          col("modifiedAt"),
          col.user((colUser) => {
            colUser("ID"),
              colUser("fullName"),
              colUser("address"),
              colUser("department_id");
          });
      });

      if (nameStaff === null && date === null && department === null) {
        const requests = await query;
        return {
          code: 200,
          data: requests,
        };
      }
      if (nameStaff && nameStaff !== null) {
        query = query.where("user.fullName ", "=", nameStaff);
      }
      if (department && department !== null) {
        query = query.where("user.department_id", "=", department);
      }
      if (date && date !== null) {
        query = query.where("startDay", "<=", date).where("endDay", ">=", date);
      }
      const requests = await query;
      return (req.results = {
        code: 200,
        data: requests,
      });
    } catch (err) {
      req.error(500, err);
    }
  },

  exportReport: async () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const filePath =`C://Users//teri.vo//Documents//Excel_Report//Report_${currentMonth}_${currentYear}.xlsx`;
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "ID", key: "ID", width: 15 },
      { header: "FullName", key: "fname", width: 15 },
      { header: "Address", key: "address", width: 25 },
      { header: "Role", key: "role", width: 10 },
      { header: "Remaining DaysOff", key: "RemainingDaysOff", width: 10 },
      { header: "DaysOff Taken", key: "DaysOffTaken", width: 10 },
      { header: "List DayOff", key: "ListDayOff", width: 10 },
    ];

 
   

    const allUsers = await SELECT.from(Users).where({ isActive: true });

    for (const user of allUsers) {
        const remainingDaysOff = user.dayOffThisYear + user.dayOffLastYear;
        const userRequestsThisMonth = await SELECT.from(Requests).where({
            user_ID: user.ID,
            status: "accepted",
        });

        const filteredRequests = userRequestsThisMonth.filter((request) => {
            const startDate = new Date(request.startDay);
            const endDate = new Date(request.endDay);
            return (
                (startDate >= firstDayOfMonth && startDate <= lastDayOfMonth) ||
                (endDate >= firstDayOfMonth && endDate <= lastDayOfMonth) ||
                (startDate <= firstDayOfMonth && endDate >= lastDayOfMonth)
            );
        });

        let days = [];
        for (const request of filteredRequests) {
            const startDay = new Date(request.startDay);
            const endDay = new Date(request.endDay);
            const daysBetween = getAllDaysBetween(startDay, endDay);
            days.push(...daysBetween);
        }
        days = filterDaysInCurrentMonth(days);
        days = await removeHolidays(days);

        user.RemainingDaysOff = remainingDaysOff;
        user.DaysOffTaken = days.length;
        user.ListDayOff = days;

        worksheet.addRow({
            ID: user.ID,
            fname: user.fullName,
            address: user.address,
            role: user.role,
            RemainingDaysOff: user.RemainingDaysOff,
            DaysOffTaken: user.DaysOffTaken,
            ListDayOff: user.ListDayOff.join(', '),
        });
    }

    await workbook.xlsx.writeFile(filePath);
    console.log(200,"Export excel successfully!");
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
function filterDaysInCurrentMonth(days) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  return days.filter((day) => {
    const month = new Date(day).getMonth() + 1;
    const year = new Date(day).getFullYear();
    return month === currentMonth && year === currentYear;
  });
}

setTimeout(async () => {
  try {
    await managerHandler.exportReport();
  } catch (error) {
    console.error(error);
  }
}, 3000); 

// const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
// const cronExpression = `0 17 ${lastDayOfMonth.getDate()} ${lastDayOfMonth.getMonth() + 1} *`;
// cron.schedule(cronExpression, async () => {
//   try {
//     await managerHandler.exportReport();
//   } catch (error) {
//     console.error(error);
//   }
// });
module.exports = managerHandler;
