const cds = require("@sap/cds");
const { Users, Departments } = cds.entities;

const departmentHandler = {
  create: async (req) => {
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
    console.log(createDepartment);

    const updateManager = await UPDATE(Users)
      .where({ ID: req.data.authentication.id })
      .set({
        department_id: id,
      });

    if (!updateManager) return req.reject(400, "Couldn't update manager");

    return req.info(201, "Create new department successfully!!!");
  },

  invite: async (req) => {
    const department = await SELECT.one
      .from(Departments)
      .where({ ID: req.data.department });
    if (!department) return req.reject(404, "Couldn't find this department");

    let memberArray;
    let nonUserArray;
    req.data.member.map(async (member) => {
      const isUser = await SELECT.one.from(Users).where({ ID: member.ID });
      if (isUser) memberArray.push(member);
      if (!isUser) nonUserArray.push(member);
    });
    console.log(memberArray);

    const updatedDepartment = await UPDATE(Departments)
      .where({ ID: req.data.department })
      .set((member = memberArray));

    if (updatedDepartment) {
      return req.info({
        code: 200,
        message: `Invited member to department successful ${
          nonUserArray && "These members wasn't in our system :" + nonUserArray
        }`,
      });
    }
  },
};

module.exports = departmentHandler;
