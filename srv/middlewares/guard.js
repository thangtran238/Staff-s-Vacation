const cds = require("@sap/cds");
const { verifyAccessToken } = require("../helpers/jwt");

const { Users, Departments } = cds.entities;

const guard = {
  authentication: async (req) => {
    const decoded = verifyAccessToken(req.headers.authorization);
    if (!decoded) return req.reject(404, "Couldn't find your token");
    if (!decoded.exp) return req.reject(402, "Your token is expired");

    const user = await SELECT.one.from(Users).where({ ID: decoded.id });
    if (user.length === 0) return req.reject(404, "User not found!");
    req.data.authentication = {
      id: decoded.id,
      role: decoded.role,
      department: user.department_id,
    };
  },

  managerAuthorization: async (req) => {
    await guard.authentication(req);
    const { authentication } = req.data;
    const department = await SELECT.one.from(Departments).where({
      id: authentication.department,
    });
    if (department?.isHRDepartment || authentication.role === "manager")
      return (req.data.authentication =  authentication );

   

    if (authentication.role !== "manager") {
      if (!department.isHRDepartment) {
        return req.reject(403, "You are not from the HR Department!!");
      }
      return req.reject(403, "You are not the manager");
    }
  },
};

module.exports = guard;
