const { invite, create } = require("./handlers/department-handler");
const { update, getRequests } = require("./handlers/manager-handler");
const { managerAuthorization } = require("./middlewares/guard");

module.exports = async (srv) => {
  srv.before("*", managerAuthorization);

  srv.on("createDepartment", create);
  srv.on("inviteMember", invite);

  srv.on("getRequests", getRequests);
  srv.on("updateRequest", update);
};
