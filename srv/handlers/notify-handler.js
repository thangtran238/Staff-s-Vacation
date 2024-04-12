const cds = require("@sap/cds");
const { Users, Notifications } = cds.entities;

const notifyHandler = {
  sending: async (res, req) => {
    const { data } = req;
    const getUser = await SELECT.one
      .from(Users)
      .where({ ID: res.data.user_ID });

    const getManager = await SELECT.one
      .from(Users)
      .where({ department_id: getUser.department_id, role: "manager" });
    let notify;
    if (res.action === "accepted" || res.action === "rejected") {
      notify = responseMessage(getManager.fname, res.action, "");
    }
    if (
      res.action === "new" ||
      res.action === "update" ||
      res.action === "delete"
    ) {
      notify = responseMessage(getUser.fname, res.action, res.data.reason);
    }

    const newNotification = await INSERT.into(Notifications).entries({
      sender: data.authentication.id,
      receivers: getManager.ID,
      message: notify,
      request_ID : res.data.ID
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

const responseMessage = (name, action, reason) => {
  if ((action === "new") | (action === "update") | (action === "delete"))
    return `${name} has just sent you a(n) ${action} request with the reason : ${reason}.Check it out!!!`;
  if ((action === "accepted") | (action === "rejected"))
    return `${name} has ${action} your request. Check it out!!!`;
};

module.exports = notifyHandler;
