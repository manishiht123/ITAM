import { useState, useEffect } from "react";
import { Drawer, Button, Input, Select, FormField, Card } from "../ui";
import { useToast } from "../../context/ToastContext";
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
  const toast = useToast();
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
    } catch (err) {
      console.error("Failed to load dropdowns", err);
      toast.error("Failed to load form data");
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.email || !formData.entity || !formData.department) {
        toast.warning("Please fill required fields (Name, Email, Entity, Department)");
        return;
      }

      if (mode === "edit") {
        if (!initialData?.id) {
          toast.error("Missing employee ID for update");
          return;
        }
        await api.updateEmployee(initialData.id, formData, formData.entity);
        toast.success("Employee updated successfully!");
      } else {
        await api.addEmployee(formData, formData.entity);
        toast.success("Employee added successfully!");
      }

      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save employee");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit Employee" : "Add Employee"}
      size="md"
    >
      <Drawer.Body>
        {/* Personal Information */}
        <Card>
          <Card.Header>
            <Card.Title>Personal Information</Card.Title>
          </Card.Header>
          <Card.Body>
            <FormField label="Full Name" required>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                fullWidth
              />
            </FormField>

            <FormField label="Email" required>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Employee Email"
                fullWidth
              />
            </FormField>

            <FormField label="Phone Number">
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                fullWidth
              />
            </FormField>

            <FormField label="Employee ID">
              <Input
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="EMP ID"
                fullWidth
              />
            </FormField>
          </Card.Body>
        </Card>

        {/* Job Details */}
        <Card>
          <Card.Header>
            <Card.Title>Job Details</Card.Title>
          </Card.Header>
          <Card.Body>
            <FormField label="Position / Designation">
              <Input
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Designation"
                fullWidth
              />
            </FormField>

            <FormField label="Entity" required>
              <Select
                name="entity"
                value={formData.entity}
                onChange={handleChange}
                disabled={mode === "edit"}
                placeholder="Select Entity"
                options={entities.map(e => ({
                  value: e.code,
                  label: e.name
                }))}
                fullWidth
              />
            </FormField>

            <FormField label="Department" required>
              <Select
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Select Department"
                options={departments.map(d => ({
                  value: d.name,
                  label: d.name
                }))}
                fullWidth
              />
            </FormField>

            <FormField label="Joining Date">
              <Input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                fullWidth
              />
            </FormField>

            <FormField label="Status">
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" }
                ]}
                fullWidth
              />
            </FormField>

            <FormField label="Employee Type">
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={[
                  { value: "Permanent", label: "Permanent" },
                  { value: "Intern", label: "Intern" },
                  { value: "Contract", label: "Contract" },
                  { value: "Consultant", label: "Consultant" }
                ]}
                fullWidth
              />
            </FormField>
          </Card.Body>
        </Card>
      </Drawer.Body>

      <Drawer.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </Drawer.Footer>
    </Drawer>
  );
}
