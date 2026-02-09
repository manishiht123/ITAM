import { useState } from "react";
import { Button, Badge, PageLayout } from "../components/ui";
import { useEntity } from "../context/EntityContext";
import EmployeeTable from "../components/employees/EmployeeTable";
import AddEmployeeDrawer from "../components/employees/AddEmployeeDrawer";

export default function Employees() {
  const { entity } = useEntity();
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
    <PageLayout>
      <PageLayout.Header
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Employees
            <Badge variant="primary">{entity || "All Entities"}</Badge>
          </div>
        }
        subtitle="Manage employee records and assignments"
        actions={
          <Button variant="primary" onClick={() => setOpenAdd(true)}>
            + Add Employee
          </Button>
        }
      />

      <PageLayout.Content>
        <EmployeeTable onEdit={handleEdit} refreshToken={refreshToken} />
      </PageLayout.Content>

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
    </PageLayout>
  );
}
