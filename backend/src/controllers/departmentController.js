const TenantManager = require("../utils/TenantManager");

const getDepartmentModel = async (req) => {
    const entityCode = req.headers['x-entity-code'];
    const sequelize = await TenantManager.getConnection(entityCode);
    if (!sequelize.models.Department) {
        console.error("[DepartmentController] Department model not found on connection!");
        const Department = require("../models/Department");
        if (Department.init) {
            Department.init(sequelize);
        }
        return Department;
    }
    return sequelize.models.Department;
};

exports.getDepartments = async (req, res) => {
    try {
        const Department = await getDepartmentModel(req);
        const departments = await Department.findAll();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const Department = await getDepartmentModel(req);
        const department = await Department.create(req.body);
        res.status(201).json(department);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const Department = await getDepartmentModel(req);
        const department = await Department.findByPk(req.params.id);
        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }
        await department.update(req.body);
        res.json(department);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const Department = await getDepartmentModel(req);
        await Department.destroy({ where: { id: req.params.id } });
        res.json({ message: "Department deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
