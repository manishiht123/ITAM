import { useState } from "react";
import EmployeeTable from "../components/employees/EmployeeTable";
import AddEmployeeDrawer from "../components/employees/AddEmployeeDrawer";

export default function Employees() {
  const [openAdd, setOpenAdd] = useState(false);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Employees</h2>
        <button className="btn-primary" onClick={() => setOpenAdd(true)}>
          + Add Employee
        </button>
      </div>

      <EmployeeTable />

      <AddEmployeeDrawer
        open={openAdd}
        onClose={() => setOpenAdd(false)}
      />
    </div>
  );
}

