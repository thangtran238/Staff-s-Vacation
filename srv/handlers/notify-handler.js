const cds = require("@sap/cds");
const { Users, Notifications } = cds.entities;

const notifyHandler = {
  sending: async (req) => {
    const { data, action } = req.data;

    const getUser = await SELECT.one.from(Users).where({ ID: data.user_ID });
    const getManager = await SELECT.one
      .from(Users)
      .where({ department_id: getUser.department_id, role: "manager" });
    let notify;
    if (action === "accepted" || action === "rejected") {
      notify = responseMessage(getManager.fullName, action, "");
      await INSERT.into(Notifications).entries({
        sender_ID: req.data.authentication.id,
        receiver_ID: getUser.ID,
        message: notify,
        request_ID: data.ID,
      });
    }
    if (action === "new" || action === "update" || action === "delete") {
      notify = responseMessage(getUser.fullName, action, data.reason);
      await INSERT.into(Notifications).entries({
        sender_ID: req.data.authentication.id,
        receiver_ID: getManager.ID,
        message: notify,
        request_ID: data.ID,
      });
    }
  },

  getNotification: async (res, req) => {
    const notification = res.filter(
      (notify) => notify.receiver === req.data.authentication.id
    );

    if (!notification) return req.reject(404, "Nothing to show here!!");

    req.results = notification;
  },

  flaggedNotification: async (req) => {
    try {
      const { data } = req;
      await UPDATE(Notifications)
        .set({
          isRead: true,
        })
        .where({
          ID: data.ID,
        });
    } catch (error) {
      return req.reject(500, error.message);
    }
  },
};

const responseMessage = (name, action, reason) => {
  if ((action === "new") | (action === "update") | (action === "delete"))
    return `${name} has just sent you a(n) ${action} request with the reason : ${reason}.Check it out!!!`;
  if ((action === "accepted") | (action === "rejected"))
    return `${name} has ${action} your request. Check it out!!!`;
};

module.exports = notifyHandler;
