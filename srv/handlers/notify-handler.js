const cds = require("@sap/cds");
const { Users, Notifications } = cds.entities;

const notifyHandler = {
  sending: async (res, req) => {
    console.log(res);
    const { data } = req;
    const getUser = await SELECT.one
      .from(Users)
      .where({ ID: res.data.user_ID });

    const getManager = await SELECT.one
      .from(Users)
      .where({ department_id: getUser.department_id, role: "manager" });
    const notify = `Title: ${getUser.fname} sent you a ${res.action} request!! \n
                    Body: ${res.data.reason}`;
    const newNotification = await INSERT.into(Notifications).entries({
      sender: data.authentication.id,
      receivers: getManager.ID,
      message: notify,
    });

    if (!newNotification)
      return req.reject(400, "Something wrong in sending notification!");
    req.results = {
      code: 200,
      message: "New notification has been sent",
      data: res.data,
    };
  },

  getNotification: async (res, req) => {
    const notification = res.filter(
      (notify) => notify.receiver === req.data.authentication.id
    );

    if (!notification) return req.reject(404, "Nothing to show here!!");

    req.results = notification;
  },

  flaggedNotification: async (req) => {},
};

module.exports = notifyHandler;
