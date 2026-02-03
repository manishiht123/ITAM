export default function UserCreate() {
  return (
    <div className="content">
      <div className="page-title">Create User</div>

      <form className="card" style={{ maxWidth: "500px" }}>
        <label>Email</label>
        <input type="email" />

        <label>Entity</label>
        <select>
          <option>OFB</option>
          <option>OXYZO</option>
        </select>

        <label>Role</label>
        <select>
          <option>Admin</option>
          <option>IT Support</option>
          <option>User</option>
        </select>

        <button>Create User</button>
      </form>
    </div>
  );
}

