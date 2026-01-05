import React, { useEffect, useState } from "react";
import "./AddAsset.css";

export default function AddAsset() {
  const [assetId, setAssetId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyYears, setWarrantyYears] = useState(3);
  const [warrantyExpiry, setWarrantyExpiry] = useState("");

  useEffect(() => {
    // mock auto-generated ID (backend will replace later)
    setAssetId("OFB/ITL/0028");
  }, []);

  useEffect(() => {
    if (!purchaseDate || !warrantyYears) return;
    const d = new Date(purchaseDate);
    d.setFullYear(d.getFullYear() + Number(warrantyYears));
    setWarrantyExpiry(d.toISOString().split("T")[0]);
  }, [purchaseDate, warrantyYears]);

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
            <select>
              <option>OFB</option>
              <option>Oxyzo</option>
            </select>
          </Field>

          <Field label="Asset Type">
            <select>
              <option>Laptop</option>
              <option>Desktop</option>
              <option>Printer</option>
            </select>
          </Field>

          <Field label="Department">
            <select>
              <option>IT</option>
              <option>Finance</option>
              <option>HR</option>
            </select>
          </Field>

          <Field label="Location">
            <select>
              <option>Gurgaon</option>
              <option>Delhi</option>
              <option>Mumbai</option>
            </select>
          </Field>

          <Field label="Ownership">
            <select>
              <option>OFB</option>
              <option>OXYZO</option>
            </select>
          </Field>
        </div>
      </section>

      {/* HARDWARE */}
      <section className="form-card">
        <h3>Hardware Specifications</h3>

        <div className="grid-3">
          <Field label="Make / Model">
            <input placeholder="Dell Latitude 5420" />
          </Field>

          <Field label="Serial Number">
            <input placeholder="SNXXXXXXX" />
          </Field>

          <Field label="CPU">
            <input placeholder="Intel i5 / i7" />
          </Field>

          <Field label="RAM">
            <input placeholder="16 GB" />
          </Field>

          <Field label="Storage">
            <input placeholder="512 GB SSD" />
          </Field>

          <Field label="Operating System">
            <input placeholder="Windows 11 Pro" />
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
            <input placeholder="₹ 75,000" />
          </Field>

          <Field label="Invoice Number">
            <input placeholder="INV-2025-001" />
          </Field>

          <Field label="Vendor Name">
            <input placeholder="Dell India Pvt Ltd" />
          </Field>
        </div>
      </section>

      {/* ACTIONS */}
      <div className="form-actions">
        <button className="btn-secondary">Cancel</button>
        <button className="btn-secondary">Save Draft</button>
        <button className="btn-primary">Save</button>
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

