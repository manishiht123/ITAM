import { useState, useEffect } from "react";
import "./employeeDrawer.css";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  employeeId: "",
  designation: "",
  department: "",
  entity: "",
  joiningDate: "",
  status: "Active",
  type: "Permanent"
};

export default function AddEmployeeDrawer({
  open,
  onClose,
  onSaved,
  mode = "add",
  initialData
}) {
  const { entity: currentEntity } = useEntity();
  const [formData, setFormData] = useState(emptyForm);

  const [departments, setDepartments] = useState([]);
  const [entities, setEntities] = useState([]);

  // Load dropdown data when drawer opens
  useEffect(() => {
    if (open) {
      loadDropdowns();
      if (mode === "edit" && initialData) {
        setFormData({
          ...emptyForm,
          ...initialData
        });
      } else {
        setFormData({
          ...emptyForm,
          entity: currentEntity || ""
        });
      }
    }
  }, [open, currentEntity, mode, initialData]);

  // Load departments (common across entities)
  useEffect(() => {
    if (!open) return;
    api.getDepartmentsCommon()
      .then(setDepartments)
      .catch(console.error);
  }, [open]);

  const loadDropdowns = async () => {
    try {
      const entityData = await api.getEntities();
      setEntities(entityData);
      // Departments are loaded via the other useEffect
    } catch (err) {
      console.error("Failed to load dropdowns", err);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.email || !formData.entity || !formData.department) {
        alert("Please fill required fields (Name, Email, Entity, Department)");
        return;
      }
      if (mode === "edit") {
        if (!initialData?.id) {
          alert("Missing employee ID for update.");
          return;
        }
        await api.updateEmployee(initialData.id, formData, formData.entity);
      } else {
        await api.addEmployee(formData, formData.entity);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="drawer-right">
        <div className="drawer-header">
          <h3>{mode === "edit" ? "Edit Employee" : "Add Employee"}</h3>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {/* ... Personal Info ... */}
          <div className="drawer-card">
            <h4>Personal Information</h4>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" value={formData.email} onChange={handleChange} placeholder="Employee Email" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
            </div>
            <div className="form-group">
              <label>Employee ID</label>
              <input name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="EMP ID" />
            </div>
          </div>

          <div className="drawer-card">
            <h4>Job Details</h4>
            <div className="form-group">
              <label>Position / Designation</label>
              <input name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation" />
            </div>

            <div className="form-group">
              <label>Entity</label>
              <select
                name="entity"
                value={formData.entity}
                onChange={handleChange}
                disabled={mode === "edit"}
              >
                <option value="">Select Entity</option>
                {entities.map(e => (
                  <option key={e.id} value={e.code}>{e.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Joining Date</label>
              <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Employee Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="Permanent">Permanent</option>
                <option value="Intern">Intern</option>
                <option value="Contract">Contract</option>
                <option value="Consultant">Consultant</option>
              </select>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </>
  );
}
