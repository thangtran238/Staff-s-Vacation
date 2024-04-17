const cds = require("@sap/cds");
const { Users, Departments } = cds.entities;

const departmentHandler = {
  create: async (req) => {
    try {
      const isHeader = await SELECT.one
        .from(Users)
        .where({ ID: req.data.authentication.id });
      if (!isHeader)
        return req.reject(400, "You already are an manager of a department!");

      const totalDepartment = await SELECT.from(Departments);
      const id = totalDepartment.length + 1;

      const createDepartment = await INSERT.into(Departments).entries({
        id: id,
        departmentName: req.data.departmentName,
      });

      const updateManager = await UPDATE(Users)
        .where({ ID: req.data.authentication.id })
        .set({ department_id: id });

      if (!updateManager) return req.reject(400, "Couldn't update manager");

      return req.info(201, "Create new department successfully!!!");
    } catch (error) {
      return req.error(500, error.message);
    }
  },

  invite: async (req) => {
    try {
      const department = await SELECT.one
        .from(Departments)
        .where({ id: req.data.department });
      if (!department) return req.reject(404, "Couldn't find this department");

      let newMembers = [];
      let alreadyInDepartment = [];
      let notInSystem = [];

      for (const member of req.data.members) {
        const user = await SELECT.one.from(Users).where({ ID: member });
        if (user) {
          if (!user.department_id) {
            await UPDATE(Users)
              .where({ ID: user.ID })
              .set({ department_id: req.data.department });
            newMembers.push(member);
          } else {
            alreadyInDepartment.push(member);
          }
        } else {
          notInSystem.push(member);
        }
      }
      let responseMessage = "";

      if (newMembers.length > 0) {
        responseMessage += `New members in the department: ${newMembers.join(
          ", "
        )}. `;
      }

      if (alreadyInDepartment.length > 0) {
        responseMessage += `Already in a department: ${alreadyInDepartment.join(
          ", "
        )}. `;
      }

      if (notInSystem.length > 0) {
        responseMessage += `Not in the system: ${notInSystem.join(", ")}. `;
      }

      return req.info(200, responseMessage.trim());
    } catch (error) {
      return req.error(500, error.message);
    }
  },
};

module.exports = departmentHandler;
