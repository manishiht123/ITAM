import React, { useEffect, useState, useRef } from "react";
import "./AddAsset.css";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useEntity } from "../context/EntityContext";
import { Button } from "../components/ui";
import { useToast } from "../context/ToastContext";
import INDIAN_CITIES from "../data/indianCities";

function CityDropdown({ value, onChange, placeholder = "Search & select city..." }) {
  const [search, setSearch] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = INDIAN_CITIES.filter(city =>
    city.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="city-dropdown-list">
          {filtered.map((city) => (
            <li
              key={city}
              className={`city-dropdown-item${city === value ? " selected" : ""}`}
              onClick={() => {
                onChange(city);
                setSearch(city);
                setOpen(false);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AddAsset() {
  const navigate = useNavigate();
  const { entity: contextEntity } = useEntity();
  const toast = useToast();

  const [assetId, setAssetId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyYears, setWarrantyYears] = useState(3);
  const [warrantyExpiry, setWarrantyExpiry] = useState("");

  // Data from API
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [entities, setEntities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [customFields, setCustomFields] = useState({});

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
    comments: "",
    depreciationMethod: "",
    usefulLifeMonths: "",
    salvageValueAmount: ""
  });

  useEffect(() => {
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

  // Auto-generate Asset ID when entity or category changes
  useEffect(() => {
    const entity = formData.entity;
    const category = formData.category;
    if (!entity || entity === "ALL" || !category) {
      setAssetId(`AST-${Math.floor(Math.random() * 10000)}`);
      return;
    }
    let cancelled = false;
    api.generateAssetId(entity, category)
      .then(res => {
        if (!cancelled) {
          setAssetId(res.assetId || `AST-${Math.floor(Math.random() * 10000)}`);
        }
      })
      .catch(() => {
        if (!cancelled) setAssetId(`AST-${Math.floor(Math.random() * 10000)}`);
      });
    return () => { cancelled = true; };
  }, [formData.entity, formData.category]);

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
      const [locs, depts, cats, cfDefs] = await Promise.all([
        api.getLocationsCommon(),
        api.getDepartmentsCommon(),
        api.getAssetCategoriesCommon(),
        api.getActiveCustomFields().catch(() => [])
      ]);
      setLocations(locs);
      setDepartments(depts);
      setCategories(cats);
      setCustomFieldDefs(cfDefs);
    } catch (err) {
      console.error("Error loading dropdowns", err);
    }
  };

  useEffect(() => {
    const entity = formData.entity;
    if (!entity || entity === "ALL") return;
    api.getVendors(entity).then(setVendors).catch(() => setVendors([]));
  }, [formData.entity]);

  useEffect(() => {
    if (!purchaseDate || !warrantyYears) return;
    const d = new Date(purchaseDate);
    d.setFullYear(d.getFullYear() + Number(warrantyYears));
    setWarrantyExpiry(d.toISOString().split("T")[0]);
  }, [purchaseDate, warrantyYears]);

  const [aiCategorySuggestion, setAiCategorySuggestion] = useState(null);

  useEffect(() => {
    const name = formData.name.trim();
    if (!name) {
      setAiCategorySuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const entityCode = formData.entity !== "ALL" ? formData.entity : null;
        const result = await api.autoCategorizeBulk([name], entityCode);
        const first = Array.isArray(result?.results) ? result.results[0] : null;
        if (first && first.category && first.category !== "Other") {
          setAiCategorySuggestion(first);
        } else {
          setAiCategorySuggestion(null);
        }
      } catch {
        setAiCategorySuggestion(null);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.name, formData.entity]);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.entity)               e.entity         = "Entity is required";
    if (!formData.name?.trim())         e.name           = "Asset Name / Tag is required";
    if (!formData.department)           e.department     = "Department is required";
    if (!formData.location?.trim())     e.location       = "Location is required";
    if (!formData.makeModel?.trim())    e.makeModel      = "Make / Model is required";
    if (!formData.serialNumber?.trim()) e.serialNumber   = "Serial Number is required";
    if (!formData.cpu?.trim())          e.cpu            = "CPU is required";
    if (!formData.ram?.trim())          e.ram            = "RAM is required";
    if (!formData.storage?.trim())      e.storage        = "Storage is required";
    if (!formData.os)                   e.os             = "Operating System is required";
    if (!purchaseDate)                  e.purchaseDate   = "Purchase Date is required";
    if (!warrantyYears || Number(warrantyYears) < 1) e.warrantyYears = "Warranty Years is required";
    if (!formData.price?.toString().trim()) e.price      = "Asset Price is required";
    if (!formData.invoice?.trim())      e.invoice        = "Invoice Number is required";
    if (!formData.insuranceStatus)      e.insuranceStatus = "Insurance Status is required";
    customFieldDefs.forEach(def => {
      if (def.required && !String(customFields[def.fieldKey] || "").trim()) {
        e[`cf_${def.fieldKey}`] = `${def.fieldName} is required`;
      }
    });
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fill in all required fields.");
      return;
    }
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
        comments: formData.comments || null,
        depreciationMethod: formData.depreciationMethod || null,
        usefulLifeMonths: formData.usefulLifeMonths ? Number(formData.usefulLifeMonths) : null,
        salvageValueAmount: formData.salvageValueAmount ? Number(formData.salvageValueAmount) : null,
        customFields: Object.keys(customFields).length > 0 ? customFields : null
      };

      // Pass entity code for correct database routing
      await api.addAsset(assetPayload, formData.entity);
      toast.success("Asset created successfully!");
      navigate("/assets");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create asset");
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

          <Field label="Entity" required error={errors.entity}>
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
            {aiCategorySuggestion && aiCategorySuggestion.category !== formData.category && (
              <div className="ai-category-suggestion">
                <span>AI suggests: <strong>{aiCategorySuggestion.category}</strong></span>
                <button
                  type="button"
                  className="ai-category-apply-btn"
                  onClick={() => setFormData(prev => ({ ...prev, category: aiCategorySuggestion.category }))}
                >
                  Apply
                </button>
              </div>
            )}
          </Field>

          <Field label="Department" required error={errors.department}>
            <select name="department" value={formData.department} onChange={handleChange}>
              <option value="">-- Select --</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Location" required error={errors.location}>
            <CityDropdown
              value={formData.location}
              onChange={(city) => {
                setFormData(prev => ({ ...prev, location: city }));
                if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
              }}
              placeholder="Search Indian city..."
            />
          </Field>

          <Field label="Asset Name / Tag" required error={errors.name}>
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
          <Field label="Make / Model" required error={errors.makeModel}>
            <input name="makeModel" value={formData.makeModel} onChange={handleChange} placeholder="Dell Latitude 5420" />
          </Field>

          <Field label="Serial Number" required error={errors.serialNumber}>
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="SNXXXXXXX" />
          </Field>

          <Field label="CPU" required error={errors.cpu}>
            <input name="cpu" value={formData.cpu} onChange={handleChange} placeholder="Intel i5 / i7" />
          </Field>

          <Field label="RAM" required error={errors.ram}>
            <input name="ram" value={formData.ram} onChange={handleChange} placeholder="16 GB" />
          </Field>

          <Field label="Storage" required error={errors.storage}>
            <input name="storage" value={formData.storage} onChange={handleChange} placeholder="512 GB SSD" />
          </Field>

          <Field label="Operating System" required error={errors.os}>
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
          <Field label="Purchase Date" required error={errors.purchaseDate}>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => {
                setPurchaseDate(e.target.value);
                if (errors.purchaseDate) setErrors(prev => ({ ...prev, purchaseDate: undefined }));
              }}
            />
          </Field>

          <Field label="Warranty (Years)" required error={errors.warrantyYears}>
            <input
              type="number"
              min="1"
              value={warrantyYears}
              onChange={(e) => {
                setWarrantyYears(e.target.value);
                if (errors.warrantyYears) setErrors(prev => ({ ...prev, warrantyYears: undefined }));
              }}
            />
          </Field>

          <Field label="Warranty Expiry Date">
            <input value={warrantyExpiry} disabled />
          </Field>

          <Field label="Asset Price" required error={errors.price}>
            <input name="price" value={formData.price} onChange={handleChange} placeholder="₹ 75,000" />
          </Field>

          <Field label="Invoice Number" required error={errors.invoice}>
            <input name="invoice" value={formData.invoice} onChange={handleChange} placeholder="INV-2025-001" />
          </Field>

          <Field label="Vendor Name">
            <select name="vendor" value={formData.vendor} onChange={handleChange}>
              <option value="">— No Vendor —</option>
              {vendors.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Insurance Status" required error={errors.insuranceStatus}>
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

      {/* DEPRECIATION OVERRIDES */}
      <section className="form-card">
        <h3>Depreciation Overrides <span style={{ fontSize: "0.8em", fontWeight: 400, color: "var(--text-muted)" }}>(optional — leave blank to use global settings)</span></h3>
        <div className="grid-3">
          <Field label="Depreciation Method">
            <select name="depreciationMethod" value={formData.depreciationMethod} onChange={handleChange}>
              <option value="">— Use Global Default —</option>
              <option value="Straight Line">Straight Line</option>
              <option value="Declining Balance">Declining Balance (WDV)</option>
            </select>
          </Field>
          <Field label="Useful Life (Months)">
            <input
              type="number"
              name="usefulLifeMonths"
              value={formData.usefulLifeMonths}
              onChange={handleChange}
              placeholder="e.g. 36"
              min="1"
            />
          </Field>
          <Field label="Salvage Value (₹)">
            <input
              type="number"
              name="salvageValueAmount"
              value={formData.salvageValueAmount}
              onChange={handleChange}
              placeholder="e.g. 5000"
              min="0"
            />
          </Field>
        </div>
      </section>

      {/* CUSTOM FIELDS */}
      {customFieldDefs.length > 0 && (
        <section className="form-card">
          <h3>Custom Fields</h3>
          <div className="grid-3">
            {customFieldDefs.map(def => (
              <Field
                key={def.id}
                label={def.fieldName}
                required={def.required}
                error={errors[`cf_${def.fieldKey}`]}
              >
                {def.fieldType === "select" ? (
                  <select
                    value={customFields[def.fieldKey] || ""}
                    onChange={e => {
                      setCustomFields(prev => ({ ...prev, [def.fieldKey]: e.target.value }));
                      if (errors[`cf_${def.fieldKey}`]) setErrors(prev => ({ ...prev, [`cf_${def.fieldKey}`]: undefined }));
                    }}
                  >
                    <option value="">— Select —</option>
                    {(def.options || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={def.fieldType === "number" ? "number" : def.fieldType === "date" ? "date" : "text"}
                    value={customFields[def.fieldKey] || ""}
                    onChange={e => {
                      setCustomFields(prev => ({ ...prev, [def.fieldKey]: e.target.value }));
                      if (errors[`cf_${def.fieldKey}`]) setErrors(prev => ({ ...prev, [`cf_${def.fieldKey}`]: undefined }));
                    }}
                    placeholder={def.fieldName}
                  />
                )}
              </Field>
            ))}
          </div>
        </section>
      )}

      {/* ACTIONS */}
      <div className="form-actions">
        <Button variant="secondary" onClick={() => navigate("/assets")}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Asset</Button>
      </div>
    </div>
  );
}

/* Reusable field wrapper */
function Field({ label, children, required, error }) {
  return (
    <div className={`field${error ? " field-has-error" : ""}`}>
      <label>{label}{required && <span className="field-required">*</span>}</label>
      {children}
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  );
}
