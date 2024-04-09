const { update, getRequests } = require("./handlers/manager-handler");
const { authentication } = require("./middlewares/guard");

module.exports = async (srv) => {
  srv.before("*", authentication);
  srv.on("getRequests", getRequests);
  srv.on("updateRequest", update);
};
