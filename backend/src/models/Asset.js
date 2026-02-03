const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const AssetSchema = {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    assetId: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false },
    entity: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM("In Use", "Available", "Under Repair", "Retired", "Theft/Missing", "Not Submitted"), defaultValue: "Available" },
    employeeId: { type: DataTypes.STRING, allowNull: true },
    department: { type: DataTypes.STRING, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
    makeModel: { type: DataTypes.STRING, allowNull: true },
    serialNumber: { type: DataTypes.STRING, allowNull: true },
    cpu: { type: DataTypes.STRING, allowNull: true },
    ram: { type: DataTypes.STRING, allowNull: true },
    storage: { type: DataTypes.STRING, allowNull: true },
    os: { type: DataTypes.STRING, allowNull: true },
    condition: { type: DataTypes.STRING, allowNull: true },
    comments: { type: DataTypes.TEXT, allowNull: true },
    additionalItems: { type: DataTypes.STRING, allowNull: true },
    insuranceStatus: { type: DataTypes.STRING, allowNull: true },
    dateOfPurchase: { type: DataTypes.DATEONLY, allowNull: true },
    warrantyExpireDate: { type: DataTypes.DATEONLY, allowNull: true },
    price: { type: DataTypes.STRING, allowNull: true },
    invoiceNumber: { type: DataTypes.STRING, allowNull: true },
    vendorName: { type: DataTypes.STRING, allowNull: true }
};

const Asset = sequelize.define("Asset", AssetSchema);
Asset.init = (seq) => seq.define("Asset", AssetSchema);

module.exports = Asset;
