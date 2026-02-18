import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Assets.css";
import api from "../services/api";
import { Button } from "../components/ui";
import { useToast } from "../context/ToastContext";

export default function AddAssetCategory() {
  const navigate = useNavigate();
  const toast = useToast();
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
      toast.success("Asset category added successfully");
      navigate("/asset-categories");
    } catch (error) {
      toast.error(error.message || "Failed to add asset category");
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

      <div className="add-category-card">
        <form onSubmit={handleSubmit} className="add-category-form">
          <div className="add-category-field">
            <label htmlFor="name" className="add-category-label">
              Category Name <span className="required-mark">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Laptops, Monitors, Printers"
              className="add-category-input"
              required
            />
            <p className="add-category-hint">Choose a clear, descriptive name for this category.</p>
          </div>

          <div className="add-category-field">
            <label htmlFor="description" className="add-category-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional details about this category – e.g. what types of assets belong here"
              rows="4"
              className="add-category-textarea"
            />
          </div>

          <div className="add-category-actions">
            <Button
              variant="secondary"
              onClick={() => navigate("/asset-categories")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
            >
              Save Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
