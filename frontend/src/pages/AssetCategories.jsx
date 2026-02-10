import { useEffect, useMemo, useState } from "react";
import "./Assets.css";
import "./AssetCategories.css";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { useNavigate } from "react-router-dom";
import { Button, Badge, PageLayout, LoadingOverlay, ConfirmDialog } from "../components/ui";
import { FaPen, FaTrash } from "react-icons/fa";
import { useToast } from "../context/ToastContext";

export default function AssetCategories() {
  const { entity } = useEntity();
  const navigate = useNavigate();
  const toast = useToast();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  useEffect(() => {
    loadData();
  }, [entity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetData, categoryData] = await Promise.all([
        api.getAssets(entity),
        api.getAssetCategoriesCommon()
      ]);
      setAssets(assetData);
      setCategories(categoryData);
    } catch (error) {
      console.error("Error fetching asset categories:", error);
      toast.error("Failed to load asset categories");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.warning("Category name is required");
      return;
    }
    try {
      const updated = await api.updateAssetCategoryCommon(editingCategory.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim()
      });
      setCategories(prev => prev.map(c => (c.id === editingCategory.id ? updated : c)));
      toast.success("Category updated successfully");
      setShowEditModal(false);
      setEditingCategory(null);
    } catch (error) {
      toast.error(error?.message || "Failed to update category");
    }
  };

  const confirmDelete = async () => {
    const { item } = deleteConfirm;
    setDeleteConfirm({ open: false, item: null });
    try {
      await api.deleteAssetCategoryCommon(item.id);
      setCategories(prev => prev.filter(c => c.id !== item.id));
      toast.success(`Category "${item.name}" deleted successfully`);
    } catch (error) {
      toast.error(error?.message || "Failed to delete category");
    }
  };

  const categoryTotals = useMemo(() => {
    const grouped = new Map();
    assets.forEach((asset) => {
      const rawCategory = asset.category || "";
      const name = rawCategory.trim() || "Uncategorized";
      const current = grouped.get(name) || {
        total: 0,
        inUse: 0,
        available: 0,
        underRepair: 0,
        retired: 0
      };

      current.total += 1;
      if (asset.status === "In Use") current.inUse += 1;
      if (asset.status === "Available") current.available += 1;
      if (asset.status === "Under Repair") current.underRepair += 1;
      if (asset.status === "Retired") current.retired += 1;

      grouped.set(name, current);
    });

    return grouped;
  }, [assets]);

  const combinedCategories = useMemo(() => {
    const rows = categories.map((category) => {
      const totals = categoryTotals.get(category.name) || {};
      return {
        id: category.id || category.name,
        name: category.name,
        description: category.description || "-",
        total: totals.total || 0,
        inUse: totals.inUse || 0,
        available: totals.available || 0,
        underRepair: totals.underRepair || 0,
        retired: totals.retired || 0
      };
    });

    return rows.sort((a, b) => b.total - a.total);
  }, [categories, categoryTotals]);

  const filteredCategories = combinedCategories.filter((category) =>
    !search || category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout>
      <PageLayout.Header
        className="asset-categories-page-header"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            Asset Categories
            <Badge variant="primary">{entity || "All Entities"}</Badge>
          </div>
        }
        subtitle="Overview of categories across assets"
        actions={
          <Button variant="primary" onClick={() => navigate("/asset-categories/add")}>
            + Add Asset Category
          </Button>
        }
      />

      <PageLayout.Content>
        <div className="asset-filters">
          <input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="asset-search-input"
          />
        </div>

        <div className="asset-table-wrapper">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Total Assets</th>
                <th>In Use</th>
                <th>Available</th>
                <th>Under Repair</th>
                <th>Retired</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="8" className="table-empty-cell">
                    <LoadingOverlay visible />
                  </td>
                </tr>
              )}
              {!loading && filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description}</td>
                  <td>{category.total}</td>
                  <td>{category.inUse}</td>
                  <td>{category.available}</td>
                  <td>{category.underRepair}</td>
                  <td>{category.retired}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        icon={<FaPen />}
                        title="Edit"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditForm({
                            name: category.name || "",
                            description: category.description === "-" ? "" : category.description || ""
                          });
                          setShowEditModal(true);
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        iconOnly
                        icon={<FaTrash />}
                        title="Delete"
                        onClick={() => setDeleteConfirm({ open: true, item: category })}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="8" className="table-empty-cell">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageLayout.Content>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm.item?.name || ""}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, item: null })}
      />

      {showEditModal && (
        <div className="page-modal-overlay">
          <div className="page-modal page-modal-md">
            <div className="page-modal-header">
              <div>
                <h2>Edit Category</h2>
              </div>
              <button className="page-modal-close" onClick={() => { setShowEditModal(false); setEditingCategory(null); }}>✕</button>
            </div>

            <form onSubmit={handleEditSave} className="page-modal-body">
              <div style={{ marginBottom: "var(--space-lg)" }}>
                <label className="page-modal-label">Category Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="page-modal-input"
                  placeholder="e.g. Laptops"
                  required
                />
              </div>

              <div style={{ marginBottom: "var(--space-lg)" }}>
                <label className="page-modal-label">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="page-modal-input"
                  style={{ resize: "none" }}
                  rows="3"
                  placeholder="Optional details about this category"
                />
              </div>

              <div className="page-modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => { setShowEditModal(false); setEditingCategory(null); }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
