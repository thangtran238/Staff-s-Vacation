const { login, signup } = require("./handlers/auth-handler");

module.exports = async (srv) => {
  srv.on("signup", signup);
  srv.on("login", login);
};
