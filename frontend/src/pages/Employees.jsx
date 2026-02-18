import { useState, useRef } from "react";
import { Button, Badge, PageLayout, ConfirmDialog } from "../components/ui";
import { useEntity } from "../context/EntityContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import EmployeeTable from "../components/employees/EmployeeTable";
import AddEmployeeDrawer from "../components/employees/AddEmployeeDrawer";
import { FaPlus, FaFileUpload, FaFileExport, FaFileAlt } from "react-icons/fa";
import "./Employees.css";

export default function Employees() {
  const { entity } = useEntity();
  const toast = useToast();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      const blob = await api.exportEmployees(entity);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `employees_export_${entity || "ALL"}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Employees exported successfully");
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Employee Name", "Employee Email ID", "Employee ID", "Department"];
    const csvContent = [headers.join(","), ""].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employees_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!entity || entity === "ALL") {
      toast.warning("Please select a single entity to import employees");
      e.target.value = null;
      return;
    }
    try {
      const result = await api.importEmployees(file, entity);
      toast.success(result?.message || "Employees imported successfully");
      setRefreshToken(v => v + 1);
    } catch (err) {
      toast.error(err.message || "Import failed");
    } finally {
      e.target.value = null;
    }
  };

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
      const entityCode = entity === "ALL" ? (item.entity || null) : entity;
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
        className="employees-page-header"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Employees
            <Badge variant="primary">{entity || "All Entities"}</Badge>
          </div>
        }
        subtitle="Manage employee records and assignments"
        actions={
          <div className="employees-actions">
            <Button
              variant="primary"
              size="md"
              icon={<FaFileAlt />}
              onClick={handleDownloadTemplate}
              title="Download CSV Template"
            >
              Template
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<FaFileUpload />}
              onClick={handleImportClick}
              title="Import employees from CSV"
            >
              Import
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<FaFileExport />}
              onClick={handleExport}
              title="Export all employees to CSV"
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<FaPlus />}
              onClick={() => setOpenAdd(true)}
            >
              Add Employee
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
            />
          </div>
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
