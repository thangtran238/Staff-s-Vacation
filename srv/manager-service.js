const { invite, create } = require("./handlers/department-handler");
const {
  update,
  getRequests,
  getRequest,
  getRequestsForHr,
} = require("./handlers/manager-handler");
const { Users, Requests } = cds.entities;
const { sending } = require("./handlers/notify-handler");
const { managerAuthorization } = require("./middlewares/guard");

module.exports = async (srv) => {
  srv.before("*", managerAuthorization);
  srv.on("getRequests", getRequests);
  srv.on("getRequest", getRequest);
  srv.on("createDepartment", create);
  srv.on("inviteMember", invite);
  srv.on("updateRequest", update);
  srv.after("updateRequest", sending);
  srv.on("getRequestsForHr", getRequestsForHr);
};
