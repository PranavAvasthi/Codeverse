// const { sequelize } = require(".");

module.exports = (sequelize, DataTypes) => {
    const users = sequelize.define("users", {
        userid : {
            type : DataTypes.INTEGER,
            primaryKey : true,
            autoIncrement : true
        },
        username : {
            type : DataTypes.STRING,
            allowNull: false,
            unique : true
        },
        passwordhash : {
            type : DataTypes.STRING,
            allowNull : false,
        },
        email : {
            type : DataTypes.STRING,
            defaultValue : "default@gmail.com"
        },
        gender : DataTypes.STRING,
        mobile : DataTypes.STRING,
        pic : DataTypes.STRING,
    },
    {
        tableName : "users",
        timestamps : false
    })
    return users;
}
