import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Assets.css";
import api from "../services/api";

export default function AddAssetCategory() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      await api.addAssetCategoryCommon(
        { name: formData.name.trim(), description: formData.description.trim() }
      );
      navigate("/asset-categories");
    } catch (error) {
      alert(error.message || "Failed to add asset category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="assets-page">
      <div className="assets-header">
        <div>
          <h1>Add Asset Category</h1>
          <p className="assets-subtitle">Create a new category for assets</p>
        </div>
      </div>

      <div className="asset-table-wrapper" style={{ maxWidth: "720px" }}>
        <form onSubmit={handleSubmit} className="asset-form">
          <div className="form-group">
            <label htmlFor="name">Category Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Laptops"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional details about this category"
              rows="4"
            />
          </div>

          <div className="asset-actions">
            <button
              type="button"
              className="asset-action-btn secondary"
              onClick={() => navigate("/asset-categories")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="asset-action-btn primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
