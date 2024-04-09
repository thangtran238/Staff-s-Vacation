const cds = require("@sap/cds");
const { Requests } = cds.entities;

const managerHandler = {
  getRequests: async (req) => {
    const requests = await cds.read(Requests);
    if (requests.length === 0) return req.info(200, "There isn't any request!");
    return req.info(200, requests);
  },

  update: async (req) => {
    const isExistedRequest = await cds
      .read(Requests)
      .where({ ID: req.data.request, status: "pending" });
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

module.exports = managerHandler;
