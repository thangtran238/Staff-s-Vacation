const { invite, create } = require("./handlers/department-handler");
const { update, getRequests, pinToken } = require("./handlers/manager-handler");
const { managerAuthorization } = require("./middlewares/guard");

module.exports = async (srv) => {
  srv.before("*", managerAuthorization);
  srv.after("READ", "RequestsResponse", getRequests);
  srv.on("createDepartment", create);
  srv.on("inviteMember", invite);
  srv.on("updateRequest", update);
};
