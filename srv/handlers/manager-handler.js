const cds = require("@sap/cds");
const { Users, Requests } = cds.entities;
const managerHandler = {
  getRequests: async (res, req) => {
    const user = await SELECT.one
      .from(Users)
      .where({ ID: req.data.authentication.id });
    const requests = res.filter(
      (request) => request.department_id === user.department_id
    );
    if (req.results.length === 0)
      return req.reject(400, "There isn't any request!");
    req.results = requests;
  },

  update: async (req) => {
    const request = await SELECT.one
      .from(Requests)
      .where({ ID: req.data.request });
    if (!request) return req.reject(404, "Couldn't find this request");
    if (request.status !== "pending")
      return req.reject(400, `You have ${request.status} this request!!!`);
    const manager = await SELECT.one
      .from(Users)
      .where({ ID: req.data.authentication.id });
    const user = await SELECT.one.from(Users).where({ ID: request.user_ID });

    if (manager.department_id !== user.department_id)
      return req.reject(402, "Your are not the manager of this request!!!");

    await cds
      .update(Requests)
      .set({ status: req.data.action })
      .where({ ID: req.data.request });

    return req.info(200, `You have ${req.data.action} this request!`);
  },
};

module.exports = managerHandler;
