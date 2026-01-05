import "./employeeDrawer.css";

export default function AddEmployeeDrawer({ open, onClose }) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="drawer-overlay" onClick={onClose}></div>

      {/* Drawer */}
      <div className="drawer-right">
        {/* Header */}
        <div className="drawer-header">
          <h3>Add Employee</h3>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Personal Info */}
          <div className="drawer-card">
            <h4>Personal Information</h4>

            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="Full Name" />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input placeholder="Employee Email" />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input placeholder="Phone Number" />
            </div>

            <div className="form-group">
              <label>Employee ID</label>
              <input placeholder="EMP ID" />
            </div>
          </div>

          {/* Job Info */}
          <div className="drawer-card">
            <h4>Job Details</h4>

            <div className="form-group">
              <label>Position / Designation</label>
              <input placeholder="Designation" />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select>
	        <option>Select Department</option>
                <option>IT</option>
                <option>HR</option>
                <option>Finance</option>
              </select>
            </div>

            <div className="form-group">
              <label>Entity</label>
              <select>
	        <option>Select Entity</option>
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
	        <option>Selact Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
	    <div className="form-group">
              <label>Employee Type</label>
              <select>
	        <option>Select Employee Type</option>
                <option>Permanent</option>
                <option>Intern</option>
	        <option>Contract</option>
	        <option>Consultant</option>
              </select>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </>
  );
}

