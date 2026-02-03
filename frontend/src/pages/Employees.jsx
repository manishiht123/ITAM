import { useState } from "react";
import EmployeeTable from "../components/employees/EmployeeTable";
import AddEmployeeDrawer from "../components/employees/AddEmployeeDrawer";

export default function Employees() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setOpenEdit(true);
  };

  const handleSaved = () => {
    setRefreshToken((value) => value + 1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Employees</h2>
        <button className="btn-primary" onClick={() => setOpenAdd(true)}>
          + Add Employee
        </button>
      </div>

      <EmployeeTable onEdit={handleEdit} refreshToken={refreshToken} />

      <AddEmployeeDrawer
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSaved={handleSaved}
        mode="add"
      />

      <AddEmployeeDrawer
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSaved={handleSaved}
        mode="edit"
        initialData={editingEmployee}
      />
    </div>
  );
}
