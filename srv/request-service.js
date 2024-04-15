const { sending, flaggedNotification } = require("./handlers/notify-handler");
const { update, remove, create } = require("./handlers/request-handler");
const { authentication } = require("./middlewares/guard");

module.exports = (srv) => {
  srv.before("*", authentication);
  srv.on("createRequest", create);
  srv.on("updateRequest", update);
  srv.on("deleteRequest", remove);
  srv.after("createRequest", sending);
  srv.after("READ", "Notifications", flaggedNotification);
};
