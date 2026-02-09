import { useState, useEffect } from "react";
import { Card, Table, Badge, Button } from "../ui";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";

export default function EmployeeTable({ onEdit, refreshToken }) {
  const { entity } = useEntity();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, [entity, refreshToken]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      if (entity === "ALL") {
        const entities = await api.getEntities();
        const codes = (entities || []).map((e) => e.code).filter(Boolean);
        const results = await Promise.allSettled(
          codes.map((code) => api.getEmployees(code))
        );
        const combined = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
        setEmployees(combined);
      } else {
        const data = await api.getEmployees(entity);
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'entity', label: 'Entity' },
    {
      key: 'assets',
      label: 'Assets',
      render: (value) => value || '0'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === "Active" ? "success" : "danger"}>
          {value}
        </Badge>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, employee) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit && onEdit(employee)}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <Card padding="none">
      <Table
        data={employees}
        columns={columns}
        loading={loading}
        emptyMessage="No employees found"
        hoverable
      />
    </Card>
  );
}
