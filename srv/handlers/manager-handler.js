const cds = require("@sap/cds");
const { Requests } = cds.entities;

const managerHandler = {
  getRequests: async (req) => {
    const isManager = roleChecking(req.data.authentication.role);
    if (!isManager) {
      return req.reject(401, "You are not a manager!");
    }

    const requests = await cds.read(Requests);
    if (requests.length === 0) return req.info(200, "There isn't any request!");
    return req.info(200, requests);
  },
  update: async (req) => {
    const isManager = roleChecking(req.data.authentication.role);
    if (!isManager) {
      return req.reject(401, "You are not a manager!");
    }

    const isExistedRequest = await cds
      .read(Requests)
      .where({ ID: req.data.request, status: "pending" } );
    if (isExistedRequest.length === 0) {
      return req.reject(404, "Couldn't find this request. Try again later!");
    }

    await cds
      .update(Requests)
      .set({ status: req.data.action })
      .where({ ID: req.data.request });

    return req.info(200, `You have ${req.data.action} this request!`);
  },
};

const roleChecking = (role) => {
  return role === "manager";
};

module.exports = managerHandler;
