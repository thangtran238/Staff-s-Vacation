const { invite, create } = require("./handlers/department-handler");
const {
  update,
  getRequests,
  getRequest,
  calculatingDayOff,
   getRequestsForHr,
} = require("./handlers/manager-handler");
const { sending, flaggedNotification } = require("./handlers/notify-handler");
const { managerAuthorization } = require("./middlewares/guard");

module.exports = async (srv) => {
  srv.before("*", managerAuthorization);
  srv.on("getRequests", getRequests);
  srv.on("getRequest", getRequest);
  srv.on("createDepartment", create);
  srv.on("inviteMember", invite);
  srv.on("updateRequest", calculatingDayOff);
  srv.after("updateRequest", update);
  srv.after("READ", "Notifications", flaggedNotification);
  srv.on("getRequestsForHr", getRequestsForHr);
  const messaging = await cds.connect.to("messaging");
  messaging.on("notifyManager", sending);
};