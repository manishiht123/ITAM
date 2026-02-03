export default function EntitySelector({ value, onChange }) {
  return (
    <div className="flex justify-end">
      <select
        className="border rounded px-3 py-2"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="ALL">All Entities</option>
        <option value="OFB">OFB</option>
        <option value="OXYZO">OXYZO</option>
      </select>
    </div>
  );
}

