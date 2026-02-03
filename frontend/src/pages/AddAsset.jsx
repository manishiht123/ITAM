import React, { useEffect, useState } from "react";
import "./AddAsset.css";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useEntity } from "../context/EntityContext";

export default function AddAsset() {
  const navigate = useNavigate();
  const { entity: contextEntity } = useEntity();

  const [assetId, setAssetId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyYears, setWarrantyYears] = useState(3);
  const [warrantyExpiry, setWarrantyExpiry] = useState("");

  // Data from API
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [entities, setEntities] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Laptop",
    entity: contextEntity || "OFB",
    department: "",
    location: "",
    status: "Available",
    makeModel: "",
    serialNumber: "",
    cpu: "",
    ram: "",
    storage: "",
    os: "",
    condition: "New",
    price: "",
    invoice: "",
    vendor: "",
    additionalItems: "",
    insuranceStatus: "",
    comments: ""
  });

  useEffect(() => {
    // Generate a simple ID
    setAssetId(`AST-${Math.floor(Math.random() * 10000)}`);
    loadEntities();
  }, []);

  // Update form entity if context changes (optional, or just init once)
  useEffect(() => {
    if (contextEntity && contextEntity !== "ALL") {
      setFormData(prev => ({ ...prev, entity: contextEntity }));
    }
  }, [contextEntity]);

  // Load dropdowns when entity changes
  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadEntities = async () => {
    try {
      const ents = await api.getEntities();
      setEntities(ents);
      if (ents.length && (!formData.entity || formData.entity === "ALL")) {
        setFormData(prev => ({ ...prev, entity: ents[0].code }));
      }
    } catch (err) {
      console.error("Failed to load entities", err);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [locs, depts, cats] = await Promise.all([
        api.getLocationsCommon(),
        api.getDepartmentsCommon(),
        api.getAssetCategoriesCommon()
      ]);
      setLocations(locs);
      setDepartments(depts);
      setCategories(cats);
    } catch (err) {
      console.error("Error loading dropdowns", err);
    }
  };

  useEffect(() => {
    if (!purchaseDate || !warrantyYears) return;
    const d = new Date(purchaseDate);
    d.setFullYear(d.getFullYear() + Number(warrantyYears));
    setWarrantyExpiry(d.toISOString().split("T")[0]);
  }, [purchaseDate, warrantyYears]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const assetPayload = {
        assetId: assetId,
        name: formData.name || formData.makeModel, // Fallback
        category: formData.category,
        entity: formData.entity,
        status: formData.status,
        department: formData.department,
        location: formData.location,
        makeModel: formData.makeModel,
        serialNumber: formData.serialNumber,
        cpu: formData.cpu,
        ram: formData.ram,
        storage: formData.storage,
        os: formData.os,
        condition: formData.condition,
        dateOfPurchase: purchaseDate || null,
        warrantyExpireDate: warrantyExpiry || null,
        price: formData.price || null,
        invoiceNumber: formData.invoice || null,
        vendorName: formData.vendor || null,
        additionalItems: formData.additionalItems || null,
        insuranceStatus: formData.insuranceStatus || null,
        comments: formData.comments || null
      };

      // Pass entity code for correct database routing
      await api.addAsset(assetPayload, formData.entity);
      alert("Asset created successfully!");
      navigate("/assets");
    } catch (err) {
      console.error(err);
      alert("Failed to create asset. Check console.");
    }
  };

  return (
    <div className="add-asset-page">
      <h1>Add New Asset</h1>
      <p className="subtitle">Capture asset details before allocation</p>

      {/* ASSET IDENTITY */}
      <section className="form-card accent">
        <h3>Asset Identity</h3>

        <div className="grid-3">
          <Field label="Asset ID (Auto)">
            <input value={assetId} disabled className="accent-input" />
          </Field>

          <Field label="Entity">
            <select name="entity" value={formData.entity} onChange={handleChange}>
              <option value="">Select Entity</option>
              {entities.map(ent => (
                <option key={ent.id} value={ent.code}>{ent.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Asset Type">
            <select name="category" value={formData.category} onChange={handleChange}>
              {categories.length === 0 && (
                <>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Printer">Printer</option>
                  <option value="Peripheral">Peripheral</option>
                </>
              )}
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Department">
            <select name="department" value={formData.department} onChange={handleChange}>
              <option value="">-- Select --</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Location">
            <select name="location" value={formData.location} onChange={handleChange}>
              <option value="">-- Select --</option>
              {locations.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Asset Name / Tag">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Dell-XPS-01" />
          </Field>

          <Field label="Status">
            <select name="status" value="Available" disabled>
              <option value="Available">Available</option>
            </select>
          </Field>
        </div>
      </section>

      {/* HARDWARE */}
      <section className="form-card">
        <h3>Hardware Specifications</h3>

        <div className="grid-3">
          <Field label="Make / Model">
            <input name="makeModel" value={formData.makeModel} onChange={handleChange} placeholder="Dell Latitude 5420" />
          </Field>

          <Field label="Serial Number">
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="SNXXXXXXX" />
          </Field>

          <Field label="CPU">
            <input name="cpu" value={formData.cpu} onChange={handleChange} placeholder="Intel i5 / i7" />
          </Field>

          <Field label="RAM">
            <input name="ram" value={formData.ram} onChange={handleChange} placeholder="16 GB" />
          </Field>

          <Field label="Storage">
            <input name="storage" value={formData.storage} onChange={handleChange} placeholder="512 GB SSD" />
          </Field>

          <Field label="Operating System">
            <select name="os" value={formData.os} onChange={handleChange}>
              <option value="">Select OS</option>
              <option value="Windows">Windows</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="MacOS">MacOS</option>
              <option value="CentOS">CentOS</option>
            </select>
          </Field>

          <Field label="Condition">
            <select name="condition" value={formData.condition} onChange={handleChange}>
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Needs Repair">Needs Repair</option>
            </select>
          </Field>
        </div>
      </section>

      {/* PROCUREMENT */}
      <section className="form-card">
        <h3>Procurement & Financial</h3>

        <div className="grid-3">
          <Field label="Purchase Date">
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </Field>

          <Field label="Warranty (Years)">
            <input
              type="number"
              min="1"
              value={warrantyYears}
              onChange={(e) => setWarrantyYears(e.target.value)}
            />
          </Field>

          <Field label="Warranty Expiry Date">
            <input value={warrantyExpiry} disabled />
          </Field>

          <Field label="Asset Price">
            <input name="price" value={formData.price} onChange={handleChange} placeholder="₹ 75,000" />
          </Field>

          <Field label="Invoice Number">
            <input name="invoice" value={formData.invoice} onChange={handleChange} placeholder="INV-2025-001" />
          </Field>

          <Field label="Vendor Name">
            <input name="vendor" value={formData.vendor} onChange={handleChange} placeholder="Dell India Pvt Ltd" />
          </Field>

          <Field label="Insurance Status">
            <select name="insuranceStatus" value={formData.insuranceStatus} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Insured">Insured</option>
              <option value="Not Insured">Not Insured</option>
            </select>
          </Field>

          <Field label="Additional Items">
            <input name="additionalItems" value={formData.additionalItems} onChange={handleChange} placeholder="Bag, Charger, Mouse" />
          </Field>

          <Field label="Comments">
            <input name="comments" value={formData.comments} onChange={handleChange} placeholder="Faulty issue notes..." />
          </Field>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="form-actions">
        <button className="btn-secondary" onClick={() => navigate("/assets")}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>Save Asset</button>
      </div>
    </div>
  );
}

/* Reusable field wrapper */
function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
