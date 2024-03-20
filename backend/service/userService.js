const db = require('../models');
const { comparePass , hashPass } = require('./bcryptService');
db.sequelize.sync();

async function checkLogin(username,password)
{
    let user = await db.users.findOne({where: {username : username}});
    console.log(user, username , password);

    if(user && await comparePass(password,user.passwordhash)){
        return user;
    } else {
        return null;
    }
}

async function createUser(userdata){
    console.log('userdata' , userdata);
    
    userdata.passwordhash = await hashPass (userdata.password);
    let usercreated = await db.users.create(userdata);
    return usercreated;
}

async function updateUser(userdata){
    userdata.passwordhash = await hashPass (userdata.password);
    let userupdated = await db.users.update({
        passwordhash:userdata.passwordhash, email:userdata.email, gender:userdata.gender,mobile:userdata.mobile,
        pic:userdata.pic, profileText:userdata.profileText},
        {where:{username:userdata.username}}
    );
    return userupdated;
}

module.exports = {checkLogin,createUser, updateUser};