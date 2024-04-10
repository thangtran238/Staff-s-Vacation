const cds = require("@sap/cds");
const { Departments, Users, Notifications } = cds.entities;

const notifyHandler = {
  sending: async (req) => {
    const { data } = req;
    const getDepartment = await SELECT.one
      .from(Departments)
      .where({ ID: data.user_id });
    const getManager = await SELECT.one
      .from(Users)
      .where({ department_id: getDepartment.department_id, role: "manager" });
    const notify = `Title: ${getDepartment.fname} sent you a request!! \n
                    Body: ${req.reason}`;
    const newNotification = await INSERT.into(Notifications).entries({
      sender: data.authentication.id,
      receivers: getManager.ID,
      message: notify,
    });

    if (!newNotification)
      return req.reject(400, "Something wrong in sending notification!");
  },

  getNotification: async (res, req) => {
    const notification = res.filter(
      (notify) => notify.receiver === req.data.authentication.id
    );

    if (!notification) return req.reject(404, "Nothing to show here!!");

    req.results = notification;
  },

  flaggedNotification: async (req) => {
    
  }
};

module.exports = notifyHandler;
