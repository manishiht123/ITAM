import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./AddAsset.css";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { Button, LoadingOverlay } from "../components/ui";
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

export default function EditAsset() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { entity: contextEntity } = useEntity();
  const toast = useToast();

  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [entities, setEntities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warrantyYears, setWarrantyYears] = useState(3);
  const [loading, setLoading] = useState(true);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [customFields, setCustomFields] = useState({});

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
    dateOfPurchase: "",
    warrantyExpireDate: "",
    price: "",
    invoiceNumber: "",
    vendorName: "",
    additionalItems: "",
    insuranceStatus: "",
    comments: "",
    depreciationMethod: "",
    usefulLifeMonths: "",
    salvageValueAmount: ""
  });

  const entityFromQuery = searchParams.get("entity") || "";
  const resolvedEntity = entityFromQuery || contextEntity || "";

  useEffect(() => {
    const loadEntities = async () => {
      try {
        const ents = await api.getEntities();
        setEntities(ents);
      } catch (err) {
        console.error("Failed to load entities", err);
        toast.error("Failed to load entities");
      }
    };
    loadEntities();
  }, []);

  useEffect(() => {
    api.getLocationsCommon().then(setLocations).catch((err) => {
      console.error(err);
      toast.error("Failed to load locations");
    });
    api.getDepartmentsCommon().then(setDepartments).catch((err) => {
      console.error(err);
      toast.error("Failed to load departments");
    });
    api.getActiveCustomFields().then(setCustomFieldDefs).catch(() => setCustomFieldDefs([]));
  }, []);

  useEffect(() => {
    const loadAsset = async () => {
      setLoading(true);
      try {
        let assets = [];
        if (resolvedEntity && resolvedEntity !== "ALL") {
          assets = await api.getAssets(resolvedEntity);
        } else {
          const ents = await api.getEntities();
          const codes = (ents || []).map((e) => e.code).filter(Boolean);
          const results = await Promise.allSettled(codes.map((code) => api.getAssets(code)));
          assets = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
        }
        const asset = assets.find((a) => String(a.id) === String(id) || String(a.assetId) === String(id));
        if (!asset) {
          toast.error("Asset not found");
          navigate("/assets");
          return;
        }
        setFormData({
          name: asset.name || "",
          category: asset.category || "Laptop",
          entity: asset.entity || resolvedEntity || "OFB",
          department: asset.department || "",
          location: asset.location || "",
          status: asset.status || "Available",
          makeModel: asset.makeModel || "",
          serialNumber: asset.serialNumber || "",
          cpu: asset.cpu || "",
          ram: asset.ram || "",
          storage: asset.storage || "",
          os: asset.os || "",
          condition: asset.condition || "New",
          dateOfPurchase: asset.dateOfPurchase || "",
          warrantyExpireDate: asset.warrantyExpireDate || "",
          price: asset.price || "",
          invoiceNumber: asset.invoiceNumber || "",
          vendorName: asset.vendorName || "",
          additionalItems: asset.additionalItems || "",
          insuranceStatus: asset.insuranceStatus || "",
          comments: asset.comments || "",
          depreciationMethod: asset.depreciationMethod || "",
          usefulLifeMonths: asset.usefulLifeMonths != null ? String(asset.usefulLifeMonths) : "",
          salvageValueAmount: asset.salvageValueAmount != null ? String(asset.salvageValueAmount) : ""
        });
        if (asset.customFields && typeof asset.customFields === "object") {
          setCustomFields(asset.customFields);
        }
        // Derive warranty years from existing dates so the field shows correctly
        if (asset.dateOfPurchase && asset.warrantyExpireDate) {
          const years = new Date(asset.warrantyExpireDate).getFullYear() - new Date(asset.dateOfPurchase).getFullYear();
          if (years > 0 && years <= 20) setWarrantyYears(years);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load asset");
      } finally {
        setLoading(false);
      }
    };
    loadAsset();
  }, [id, resolvedEntity, navigate]);

  useEffect(() => {
    const entity = formData.entity;
    if (!entity || entity === "ALL") return;
    api.getVendors(entity).then(setVendors).catch(() => setVendors([]));
  }, [formData.entity]);

  useEffect(() => {
    if (!formData.dateOfPurchase || !warrantyYears) return;
    const d = new Date(formData.dateOfPurchase);
    d.setFullYear(d.getFullYear() + Number(warrantyYears));
    setFormData(prev => ({ ...prev, warrantyExpireDate: d.toISOString().split("T")[0] }));
  }, [formData.dateOfPurchase, warrantyYears]);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.entity)         e.entity         = "Entity is required";
    if (!formData.name?.trim())   e.name           = "Asset Name / Tag is required";
    if (!formData.department)     e.department     = "Department is required";
    if (!formData.location?.trim()) e.location     = "Location is required";
    if (!formData.makeModel?.trim()) e.makeModel   = "Make / Model is required";
    if (!formData.serialNumber?.trim()) e.serialNumber = "Serial Number is required";
    if (!formData.cpu?.trim())    e.cpu            = "CPU is required";
    if (!formData.ram?.trim())    e.ram            = "RAM is required";
    if (!formData.storage?.trim()) e.storage       = "Storage is required";
    if (!formData.os)             e.os             = "Operating System is required";
    if (!formData.dateOfPurchase) e.dateOfPurchase = "Purchase Date is required";
    if (!warrantyYears || Number(warrantyYears) < 1) e.warrantyYears = "Warranty Years is required";
    if (!formData.price?.toString().trim()) e.price = "Asset Price is required";
    if (!formData.invoiceNumber?.trim()) e.invoiceNumber = "Invoice Number is required";
    if (!formData.insuranceStatus) e.insuranceStatus = "Insurance Status is required";
    customFieldDefs.forEach(def => {
      if (def.required && !String(customFields[def.fieldKey] || "").trim()) {
        e[`cf_${def.fieldKey}`] = `${def.fieldName} is required`;
      }
    });
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const payload = {
        ...formData,
        customFields: Object.keys(customFields).length > 0 ? customFields : null
      };
      await api.updateAsset(id, payload, resolvedEntity || formData.entity);
      toast.success("Asset updated successfully!");
      navigate("/assets");
    } catch (err) {
      toast.error(err.message || "Failed to update asset");
    }
  };

  if (loading) return <LoadingOverlay visible />;

  return (
    <div className="add-asset-page">
      <h1>Edit Asset</h1>
      <p className="subtitle">Update asset details and configuration</p>

      <section className="form-card accent">
        <h3>Asset Identity</h3>
        <div className="grid-3">
          <Field label="Entity" required error={errors.entity}>
            <select name="entity" value={formData.entity} onChange={handleChange}>
              <option value="">Select Entity</option>
              {entities.map((ent) => (
                <option key={ent.id} value={ent.code}>{ent.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Asset Type">
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="Laptop">Laptop</option>
              <option value="Desktop">Desktop</option>
              <option value="Printer">Printer</option>
              <option value="Peripheral">Peripheral</option>
            </select>
          </Field>
          <Field label="Department" required error={errors.department}>
            <select name="department" value={formData.department} onChange={handleChange}>
              <option value="">-- Select --</option>
              {departments.map((d) => (
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
            <input name="name" value={formData.name} onChange={handleChange} />
          </Field>
          <Field label="Status">
            <select name="status" value={formData.status} onChange={handleChange}>
              {["Available", "In Use"].includes(formData.status) && (
                <option value={formData.status} disabled>
                  {formData.status} (Locked)
                </option>
              )}
              <option value="Under Repair">Under Repair</option>
              <option value="Retired">Retired</option>
              <option value="Theft/Missing">Theft/Missing</option>
              <option value="Not Submitted">Not Submitted</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="form-card">
        <h3>Hardware Specifications</h3>
        <div className="grid-3">
          <Field label="Make / Model" required error={errors.makeModel}>
            <input name="makeModel" value={formData.makeModel} onChange={handleChange} />
          </Field>
          <Field label="Serial Number" required error={errors.serialNumber}>
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} />
          </Field>
          <Field label="CPU" required error={errors.cpu}>
            <input name="cpu" value={formData.cpu} onChange={handleChange} />
          </Field>
          <Field label="RAM" required error={errors.ram}>
            <input name="ram" value={formData.ram} onChange={handleChange} />
          </Field>
          <Field label="Storage" required error={errors.storage}>
            <input name="storage" value={formData.storage} onChange={handleChange} />
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

      <section className="form-card">
        <h3>Procurement & Financial</h3>
        <div className="grid-3">
          <Field label="Purchase Date" required error={errors.dateOfPurchase}>
            <input
              type="date"
              name="dateOfPurchase"
              value={formData.dateOfPurchase}
              onChange={handleChange}
            />
          </Field>
          <Field label="Warranty (Years)" required error={errors.warrantyYears}>
            <input
              type="number"
              min="1"
              max="20"
              value={warrantyYears}
              onChange={(e) => {
                setWarrantyYears(e.target.value);
                if (errors.warrantyYears) setErrors(prev => ({ ...prev, warrantyYears: undefined }));
              }}
            />
          </Field>
          <Field label="Warranty Expiry Date">
            <input
              type="date"
              value={formData.warrantyExpireDate}
              disabled
            />
          </Field>
          <Field label="Asset Price" required error={errors.price}>
            <input name="price" value={formData.price} onChange={handleChange} placeholder="₹ 75,000" />
          </Field>
          <Field label="Invoice Number" required error={errors.invoiceNumber}>
            <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} />
          </Field>
          <Field label="Vendor Name">
            <select name="vendorName" value={formData.vendorName} onChange={handleChange}>
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
            <input name="additionalItems" value={formData.additionalItems} onChange={handleChange} />
          </Field>
          <Field label="Comments">
            <input name="comments" value={formData.comments} onChange={handleChange} />
          </Field>
        </div>
      </section>

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

      <div className="form-actions">
        <Button variant="secondary" onClick={() => navigate("/assets")}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}

function Field({ label, children, required, error }) {
  return (
    <div className={`field${error ? " field-has-error" : ""}`}>
      <label>{label}{required && <span className="field-required">*</span>}</label>
      {children}
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  );
}
