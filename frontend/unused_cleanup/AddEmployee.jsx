export default function AddEmployee() {
  return (
    <div className="page-container bg-muted">
      <h2 className="page-title">Add New Employee</h2>

      <div className="grid-2">
        {/* Left Card */}
        <div className="card">
          <h3 className="card-title">Personal Information</h3>

          <div className="form-group">
            <label>Full Name</label>
            <input placeholder="Rahul Sharma" />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input placeholder="rahul@company.com" />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input placeholder="+91 98765 43210" />
          </div>

          <div className="form-group">
            <label>Employee ID</label>
            <input placeholder="EMP-1023" />
          </div>
        </div>

        {/* Right Card */}
        <div className="card">
          <h3 className="card-title">Job Details</h3>

          <div className="form-group">
            <label>Position / Designation</label>
            <input placeholder="Senior IT Engineer" />
          </div>

          <div className="form-group">
            <label>Department</label>
            <select>
              <option>IT</option>
              <option>HR</option>
              <option>Finance</option>
            </select>
          </div>

          <div className="form-group">
            <label>Entity</label>
            <select>
              <option>OXYZO</option>
              <option>OFB</option>
            </select>
          </div>

          <div className="form-group">
            <label>Joining Date</label>
            <input type="date" />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-actions">
        <button className="btn-secondary">Cancel</button>
        <button className="btn-primary">Save Employee</button>
      </div>
    </div>
  );
}

