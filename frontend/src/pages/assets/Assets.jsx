import React, { useState } from "react";
import { FaPlus, FaFileImport, FaFileExport } from "react-icons/fa";

/**
 * Assets Page
 * Entity-aware
 * Dashboard-safe
 * Enterprise ITAM standard
 */

export default function Assets() {
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    entity: "",
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <AssetHeader />

      {/* KPI Summary */}
      <AssetKPIs />

      {/* Filters */}
      <AssetFilters filters={filters} setFilters={setFilters} />

      {/* Asset Table */}
      <AssetTable />
    </div>
  );
}

/* ================= HEADER ================= */

function AssetHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Assets</h1>
        <p className="text-sm text-gray-500">
          Centralized inventory across entities
        </p>
      </div>

      <div className="flex gap-3">
        <button className="btn-primary flex items-center gap-2">
          <FaPlus /> Add Asset
        </button>

        <button className="btn-secondary flex items-center gap-2">
          <FaFileImport /> Import
        </button>

        <button className="btn-secondary flex items-center gap-2">
          <FaFileExport /> Export
        </button>
      </div>
    </div>
  );
}

/* ================= KPI CARDS ================= */

function AssetKPIs() {
  const stats = [
    { label: "Total Assets", value: 1240 },
    { label: "Allocated", value: 860 },
    { label: "Available", value: 290 },
    { label: "Under Repair", value: 54 },
    { label: "Retired", value: 36 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl p-4 shadow-sm border"
        >
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="text-2xl font-semibold text-gray-800">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ================= FILTER BAR ================= */

function AssetFilters({ filters, setFilters }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border flex flex-wrap gap-4">
      <select
        className="input"
        value={filters.entity}
        onChange={(e) =>
          setFilters({ ...filters, entity: e.target.value })
        }
      >
        <option value="">All Entities</option>
        <option value="ofb">OFB</option>
        <option value="oxyzo">Oxyzo</option>
      </select>

      <select
        className="input"
        value={filters.category}
        onChange={(e) =>
          setFilters({ ...filters, category: e.target.value })
        }
      >
        <option value="">All Categories</option>
        <option value="laptop">Laptop</option>
        <option value="desktop">Desktop</option>
        <option value="server">Server</option>
      </select>

      <select
        className="input"
        value={filters.status}
        onChange={(e) =>
          setFilters({ ...filters, status: e.target.value })
        }
      >
        <option value="">All Status</option>
        <option value="in_use">In Use</option>
        <option value="available">Available</option>
        <option value="repair">Under Repair</option>
        <option value="retired">Retired</option>
      </select>
    </div>
  );
}

/* ================= TABLE ================= */

function AssetTable() {
  const assets = [
    {
      tag: "AST-1001",
      name: "Dell Latitude 5420",
      category: "Laptop",
      status: "In Use",
      assignedTo: "Rahul Sharma",
      entity: "OFB",
      location: "Gurgaon",
    },
    {
      tag: "AST-1002",
      name: "HP ProDesk",
      category: "Desktop",
      status: "Available",
      assignedTo: "-",
      entity: "Oxyzo",
      location: "Delhi",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 text-left">Asset Tag</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Assigned To</th>
            <th className="px-4 py-3 text-left">Entity</th>
            <th className="px-4 py-3 text-left">Location</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.tag}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-medium">
                {asset.tag}
              </td>
              <td className="px-4 py-3">{asset.name}</td>
              <td className="px-4 py-3">{asset.category}</td>
              <td className="px-4 py-3">
                <StatusBadge status={asset.status} />
              </td>
              <td className="px-4 py-3">{asset.assignedTo}</td>
              <td className="px-4 py-3">{asset.entity}</td>
              <td className="px-4 py-3">{asset.location}</td>
              <td className="px-4 py-3 text-right">
                <AssetRowActions />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function StatusBadge({ status }) {
  const colors = {
    "In Use": "bg-green-100 text-green-700",
    Available: "bg-blue-100 text-blue-700",
    "Under Repair": "bg-orange-100 text-orange-700",
    Retired: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        colors[status]
      }`}
    >
      {status}
    </span>
  );
}

function AssetRowActions() {
  return (
    <button className="text-blue-600 hover:underline">
      View
    </button>
  );
}

