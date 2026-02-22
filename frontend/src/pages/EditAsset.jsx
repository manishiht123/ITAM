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
  const [loading, setLoading] = useState(true);

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
    comments: ""
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
          comments: asset.comments || ""
        });
      } catch (err) {
        toast.error(err.message || "Failed to load asset");
      } finally {
        setLoading(false);
      }
    };
    loadAsset();
  }, [id, resolvedEntity, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.updateAsset(id, formData, resolvedEntity || formData.entity);
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
          <Field label="Entity">
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
          <Field label="Department">
            <select name="department" value={formData.department} onChange={handleChange}>
              <option value="">-- Select --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <CityDropdown
              value={formData.location}
              onChange={(city) => setFormData(prev => ({ ...prev, location: city }))}
              placeholder="Search Indian city..."
            />
          </Field>
          <Field label="Asset Name / Tag">
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
          <Field label="Make / Model">
            <input name="makeModel" value={formData.makeModel} onChange={handleChange} />
          </Field>
          <Field label="Serial Number">
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} />
          </Field>
          <Field label="CPU">
            <input name="cpu" value={formData.cpu} onChange={handleChange} />
          </Field>
          <Field label="RAM">
            <input name="ram" value={formData.ram} onChange={handleChange} />
          </Field>
          <Field label="Storage">
            <input name="storage" value={formData.storage} onChange={handleChange} />
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

      <section className="form-card">
        <h3>Procurement & Financial</h3>
        <div className="grid-3">
          <Field label="Purchase Date">
            <input
              type="date"
              name="dateOfPurchase"
              value={formData.dateOfPurchase}
              onChange={handleChange}
            />
          </Field>
          <Field label="Warranty Expiry Date">
            <input
              type="date"
              name="warrantyExpireDate"
              value={formData.warrantyExpireDate}
              onChange={handleChange}
            />
          </Field>
          <Field label="Asset Price">
            <input name="price" value={formData.price} onChange={handleChange} placeholder="₹ 75,000" />
          </Field>
          <Field label="Invoice Number">
            <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} />
          </Field>
          <Field label="Vendor Name">
            <input name="vendorName" value={formData.vendorName} onChange={handleChange} />
          </Field>
          <Field label="Insurance Status">
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

      <div className="form-actions">
        <Button variant="secondary" onClick={() => navigate("/assets")}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
