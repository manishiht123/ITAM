const TenantManager = require("../utils/TenantManager");

const getEmployeeModel = async (req) => {
    const entityCode = req.headers['x-entity-code'];
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.Employee) {
        console.error("[EmployeeController] Employee model not found on connection!");
        // Force init if missing (should contain static init method)
        const Employee = require("../models/Employee");
        // Check if init exists before calling
        if (Employee.init) {
            Employee.init(sequelize);
        }
        return Employee; // Fallback to module export if something fails
    }
    return sequelize.models.Employee;
};

exports.getEmployees = async (req, res) => {
    try {
        const Employee = await getEmployeeModel(req);
        const employees = await Employee.findAll();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const Employee = await getEmployeeModel(req);
        const employee = await Employee.create(req.body);
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateEmployee = async (req, res) => {
    try {
        const Employee = await getEmployeeModel(req);
        await Employee.update(req.body, { where: { id: req.params.id } });
        const updated = await Employee.findByPk(req.params.id);
        res.json(updated || { message: "Employee updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

