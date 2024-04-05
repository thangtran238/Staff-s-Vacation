const bcrypt = require('bcrypt');
module.exports = (srv)=>{
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
    
}