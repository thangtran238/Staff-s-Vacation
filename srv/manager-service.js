const { invite, create } = require("./handlers/department-handler");
const {
  update,
  getRequests,
  calculatingDayOff,
  getRequestsForHr,
} = require("./handlers/manager-handler");
const {
  sending,
  flaggedNotification,
  getNotifications,
} = require("./handlers/notify-handler");
const { managerAuthorization } = require("./middlewares/guard");

module.exports = async (srv) => {
  srv.before("*", managerAuthorization);
  srv.on("getRequests", getRequests);
  srv.on("getNotifications", getNotifications);
  srv.on("createDepartment", create);
  srv.on("inviteMember", invite);
  srv.on("updateRequest", calculatingDayOff);
  srv.after("updateRequest", update);
  srv.after("getNotifications", flaggedNotification);
  srv.on("getRequestsForHR", getRequestsForHr);
  const messaging = await cds.connect.to("messaging");
  messaging.on("notifyManager", sending);
};
