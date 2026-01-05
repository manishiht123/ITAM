export default function EmployeeTable() {
  const employees = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@company.com",
      department: "IT",
      entity: "OXYZO",
      status: "Active",
      assets: 2
    }
  ];

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
              <button className="btn-secondary">Edit</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

