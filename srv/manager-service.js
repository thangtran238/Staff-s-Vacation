const cds = require("@sap/cds");

module.exports = async (srv) => {
  srv.before("*", "Request", (req) => {
    console.log(req);
  });
  srv.on("READ", "Request", (req) => {});
  srv.before("UPDATE", "Request", async (req) => {
    //Checking the role first!

    //Checking the status of the request
    const requireAbsence = await SELECT("*")
      .from("Request")
      .where({ ID: req.params }, { status: "pending" });
    if (!requireAbsence)
      return req.reject(404, "Couldn't find this request!!!");
  });
};
