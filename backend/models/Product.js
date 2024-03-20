// const { sequelize } = require(".");

module.exports = (sequelize, DataTypes) => {
    const product = sequelize.define("product", {
        userid : {
            type : DataTypes.INTEGER,
            primaryKey : true,
            autoIncrement : true
        },
        title : {
            type : DataTypes.STRING,
            allowNull: false
        },
        description : {
            type : DataTypes.STRING,
            allowNull: false,
        },
        pic : DataTypes.STRING
    },
    {
        tableName : "product",
        timestamps : false
    })
    return product;
}