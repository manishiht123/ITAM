import { useState } from "react";
import { Button, Badge, PageLayout, ConfirmDialog } from "../components/ui";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import EmployeeTable from "../components/employees/EmployeeTable";
import AddEmployeeDrawer from "../components/employees/AddEmployeeDrawer";

export default function Employees() {
  const { entity } = useEntity();
  const toast = useToast();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setOpenEdit(true);
  };

  const handleDelete = (employee) => {
    setDeleteConfirm({ open: true, item: employee });
  };

  const confirmDelete = async () => {
    const { item } = deleteConfirm;
    setDeleteConfirm({ open: false, item: null });
    try {
      const entityCode = entity === "ALL" ? null : entity;
      await api.deleteEmployee(item.id, entityCode);
      toast.success(`Employee "${item.name}" deleted successfully`);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      toast.error(error?.message || "Failed to delete employee");
    }
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
        <EmployeeTable onEdit={handleEdit} onDelete={handleDelete} refreshToken={refreshToken} />
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

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteConfirm.item?.name || ""}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, item: null })}
      />
    </PageLayout>
  );
}
