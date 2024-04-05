const cds = require("@sap/cds");
const bcrypt = require('bcryptjs');
const connection = require("./helpers/db");
const { generateAccessToken, generateRefreshToken } = require("./helpers/jwt");

module.exports = async (srv) =>{
  const db = await connection();

    const {Users} = cds.entities ('vacation')
    srv.before('CREATE', 'Users', async (req) => {
        const user = req.data;
        const existingUser = await SELECT.from(Users).where({ username: user.username });
        if (existingUser.length > 0) {
            req.error({
                code: 400,
                message: 'Username already exists'
            });
        }
        if (user.password) {
            const hashedPassword = bcrypt.hashSync(user.password, 10);
            user.password = hashedPassword;
        }
    });

    srv.on("login", async (req) => {
        const user = await db.read(Users).where({ username: req.data.username });
        if (!user || user.length !== 1)
          return req.reject(401, "Invalid username or password");
    
        if (!await bcrypt.compare(req.data.password,user[0].password)) {
          return req.reject(401, "Invalid password");
        }
        const accessToken = generateAccessToken(user[0]);
        const refreshToken = generateRefreshToken(user[0]);
    
        const updatedUser = await db
          .update(Users)
          .where({ ID: user[0].ID })
          .set({ refreshToken: refreshToken });
        if (!updatedUser) {
          return req.reject(500, "Failed to update the user's token.");
        }
        return accessToken;
      });
    
}