const bcrypt = require('bcrypt');
var rounds = 10;
async function hashPass(pass){
    let  salt =  await bcrypt.genSalt(rounds);
    let hash = await bcrypt.hash(pass,salt); 
    return hash;
}

async function comparePass(pass, hash){
    let ans = await bcrypt.compare(pass, hash);
    return ans;
}

async function test(userpass, newpass){
    let h1 = await hashPass(userpass);
    console.log(h1);
    let ans3 = await bcrypt.compare(newpass, h1);
    console.log(ans3);
}
test('shopclue', 'shopclue');

module.exports = {hashPass, comparePass}
