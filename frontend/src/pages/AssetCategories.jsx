import { useEffect, useMemo, useState } from "react";
import "./Assets.css";
import api from "../services/api";
import { useEntity } from "../context/EntityContext";
import { useNavigate } from "react-router-dom";

export default function AssetCategories() {
  const { entity } = useEntity();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entity]);

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
    <div className="assets-page">
      <div className="assets-header">
        <div>
          <h1>Asset Category</h1>
          <p className="assets-subtitle">Overview of categories across assets</p>
        </div>
        <div className="asset-actions">
          <button
            className="asset-action-btn primary"
            onClick={() => navigate("/asset-categories/add")}
          >
            + Add Asset Category
          </button>
        </div>
      </div>

      <div className="asset-filters">
        <input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  Loading categories...
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
              </tr>
            ))}
            {!loading && filteredCategories.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
