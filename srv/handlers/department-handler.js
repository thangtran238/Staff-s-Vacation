const cds = require("@sap/cds");
const { Users, Departments } = cds.entities;

const departmentHandler = {
  invite: async (req) => {
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
