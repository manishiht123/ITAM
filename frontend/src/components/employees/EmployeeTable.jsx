import { useState, useEffect } from "react";
import api from "../../services/api";
import { useEntity } from "../../context/EntityContext";

export default function EmployeeTable({ onEdit, refreshToken }) {
  const { entity } = useEntity();
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    loadEmployees();
  }, [entity, refreshToken]);

  const loadEmployees = async () => {
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
    }
  };

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Department</th>
          <th>Entity</th>
          <th>Assets</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {employees.map(emp => (
          <tr key={emp.id}>
            <td>{emp.name}</td>
            <td>{emp.email}</td>
            <td>{emp.department}</td>
            <td>{emp.entity}</td>
            <td>{emp.assets}</td>
            <td>
              <span className={`badge ${emp.status === "Active" ? "success" : "danger"}`}>
                {emp.status}
              </span>
            </td>
            <td>
              <button
                className="btn-secondary"
                onClick={() => onEdit && onEdit(emp)}
              >
                Edit
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
