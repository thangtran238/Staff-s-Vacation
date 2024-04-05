module.exports = (srv)=>{
    const {Request} = cds.entities ('vacation')
    srv.before('CREATE','Request', async (req) => {
        const {request,user_id} = req.data;
        const currentUser = await SELECT.one.from(Users).where({ ID: user_id });
        if (!currentUser) {
            req.error({
                code: 400,
                message: 'User not found'
            });
            return;
        }
        const createdAtDate = new Date(currentUser.createdAt);
        const createdAtMonth = createdAtDate.getMonth() + 1; 
        const createdAtYear = createdAtDate.getFullYear();
        
    });
    
}