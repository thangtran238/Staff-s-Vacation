const { login, signup, refresh } = require("./handlers/auth-handler");

module.exports = async (srv) => {
  srv.on("signup", signup);
  srv.on("login", login);
  srv.on("refresh", refresh);
};
