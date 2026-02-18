import api from "./api";

const DEFAULT_STATUSES = ["In Use", "Available", "Under Repair", "Retired"];

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sortByDateDesc = (a, b) => {
  const dateA = toDate(a) || new Date(0);
  const dateB = toDate(b) || new Date(0);
  return dateB - dateA;
};

const getEntityFilter = (entityCode) =>
  !entityCode || entityCode === "ALL" ? null : entityCode;

const normalizeEntityCode = (value) =>
  value && String(value).trim() ? String(value).trim().toUpperCase() : "";

const safeLabel = (value, fallback) =>
  value && String(value).trim() ? String(value).trim() : fallback;

const pickOS = (asset) =>
  asset?.os ||
  asset?.operatingSystem ||
  asset?.platform ||
  asset?.osName ||
  null;

const buildBreakdown = (items, keyGetter, fallbackLabel = "Unknown") => {
  const counts = new Map();
  items.forEach((item) => {
    const label = safeLabel(keyGetter(item), fallbackLabel);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    value
  }));
};

const buildDashboardData = (assets, employees, licenses, entityCode) => {
  const entityFilter = getEntityFilter(entityCode);
  const normalizedFilter = normalizeEntityCode(entityFilter);
  const scopedAssets = entityFilter
    ? assets.filter((asset) => normalizeEntityCode(asset.entity) === normalizedFilter)
    : assets;

  const scopedLicenses = entityFilter
    ? (licenses || []).filter((license) => {
      const licenseEntity =
        normalizeEntityCode(license._entityCode) ||
        normalizeEntityCode(license.entity);
      // Single-entity inventory responses often don't include entity on each row.
      // In that case, treat rows as already scoped to the selected entity.
      if (!licenseEntity) return true;
      return licenseEntity === normalizedFilter;
    })
    : licenses || [];

  const statusBreakdown = scopedAssets.length
    ? buildBreakdown(scopedAssets, (asset) => asset.status, "Unknown")
    : [];

  if (statusBreakdown.length) {
    DEFAULT_STATUSES.forEach((status) => {
      if (!statusBreakdown.find((entry) => entry.label === status)) {
        statusBreakdown.push({ label: status, value: 0 });
      }
    });
  }

  const statusCounts = statusBreakdown.reduce((acc, entry) => {
    acc[entry.label] = entry.value;
    return acc;
  }, {});

  const categoryBreakdown = scopedAssets.length
    ? buildBreakdown(scopedAssets, (asset) => asset.category, "Uncategorized")
    : [];

  const osBreakdown = scopedAssets.length
    ? buildBreakdown(scopedAssets, (asset) => pickOS(asset), "Unknown")
    : [];

  const employeesById = employees.reduce((acc, employee) => {
    const key = employee.employeeId || employee.id;
    if (key) acc[String(key)] = employee;
    return acc;
  }, {});

  const assignments = scopedAssets.map((asset) => {
    const employee =
      asset.employeeId && employeesById[String(asset.employeeId)]
        ? employeesById[String(asset.employeeId)]
        : null;

    const isAssigned = Boolean(employee || asset.employeeId);

    return {
      assetTag: asset.assetId || asset.id,
      assetType: asset.category || asset.name || "Asset",
      user: employee?.name || (asset.employeeId ? "Assigned" : "—"),
      department: employee?.department || asset.department || "—",
      entity: asset.entity || entityFilter || "—",
      status: isAssigned ? "Assigned" : "Unassigned",
      updatedAt: asset.updatedAt || asset.createdAt || null
    };
  });

  const recentlyAdded = [...scopedAssets]
    .sort((a, b) => sortByDateDesc(a.createdAt, b.createdAt))
    .slice(0, 5)
    .map((asset) => ({
      tag: asset.assetId || asset.id,
      type: asset.category || asset.name || "Asset",
      entity: asset.entity || "—",
      date: asset.createdAt || asset.updatedAt || null
    }));

  const recentlyAssigned = [...assignments]
    .filter((assignment) => assignment.status === "Assigned")
    .sort((a, b) => sortByDateDesc(a.updatedAt, b.updatedAt))
    .slice(0, 5)
    .map((assignment) => ({
      tag: assignment.assetTag,
      user: assignment.user,
      entity: assignment.entity,
      date: assignment.updatedAt || null
    }));

  const attentionItems = scopedAssets
    .filter((asset) => asset.status === "Under Repair" || asset.status === "Retired")
    .slice(0, 6)
    .map((asset) => ({
      item: asset.assetId || asset.id,
      issue:
        asset.status === "Under Repair"
          ? "Under repair"
          : "Retired asset",
      severity: asset.status === "Under Repair" ? "High" : "Medium"
    }));

  const kpis = {
    totalAssets: scopedAssets.length,
    allocated: statusCounts["In Use"] || 0,
    available: statusCounts["Available"] || 0,
    underRepair: statusCounts["Under Repair"] || 0
  };

  const licenseTotals = scopedLicenses.reduce(
    (acc, row) => {
      const owned = Number(row.seatsOwned || 0);
      const used = Number(row.seatsUsed || 0);
      acc.used += used;
      acc.owned += owned;
      acc.overused += Math.max(used - owned, 0);
      return acc;
    },
    { used: 0, owned: 0, overused: 0 }
  );

  const licenseUsage = scopedLicenses.length
    ? [
      { name: "Used Seats", value: licenseTotals.used },
      { name: "Available Seats", value: Math.max(licenseTotals.owned - licenseTotals.used, 0) },
      { name: "Over-allocated", value: licenseTotals.overused }
    ]
    : [];

  const alerts = [
    {
      severity: "warning",
      title: "Unassigned Assets",
      value: assignments.filter((row) => row.status === "Unassigned").length,
      description: "Assets not allocated"
    },
    {
      severity: "critical",
      title: "Assets Under Repair",
      value: statusCounts["Under Repair"] || 0,
      description: "Requires attention"
    },
    {
      severity: "warning",
      title: "Retired Assets",
      value: statusCounts["Retired"] || 0,
      description: "Inactive assets"
    }
  ];

  const compliance = [
    { title: "Asset Coverage", status: "Tracked", variant: "success" },
    { title: "Data Freshness", status: "Live", variant: "info" },
    { title: "Audit Readiness", status: "Monitoring", variant: "warning" }
  ];

  return {
    kpis,
    licenseKpis: {
      totalLicenses: scopedLicenses.length || 0,
      overusedSeats: licenseTotals.overused || 0
    },
    statusBreakdown,
    categoryBreakdown,
    osBreakdown,
    licenseUsage,
    alerts,
    compliance,
    assignments,
    recentlyAdded,
    recentlyAssigned,
    attentionItems,
    upcomingRenewals: scopedLicenses
      .filter((row) => row.renewalDate)
      .sort((a, b) => sortByDateDesc(a.renewalDate, b.renewalDate))
      .slice(0, 6)
      .map((row) => ({
        name: row.product || "License",
        type: "License",
        date: row.renewalDate
      }))
  };
};

export async function getDashboardData(entityCode) {
  const entityFilter = getEntityFilter(entityCode);
  if (!entityFilter) {
    // Determine which entities the current user can access
    let codes = [];
    try {
      const stored = localStorage.getItem("authUser");
      const user = stored ? JSON.parse(stored) : null;
      const role = String(user?.role || "").trim().toLowerCase();
      const isAdmin = ["admin", "superadmin", "administrator"].includes(role);
      const allowed = Array.isArray(user?.allowedEntities) ? user.allowedEntities.filter(Boolean) : [];

      if (isAdmin || !allowed.length) {
        // Admin or no entity restrictions — fetch all entities
        const entities = await api.getEntities();
        codes = (entities || []).map((e) => e.code).filter(Boolean);
      } else {
        // Non-admin with specific entities — only fetch their allowed entities
        codes = allowed;
      }
    } catch {
      const entities = await api.getEntities();
      codes = (entities || []).map((e) => e.code).filter(Boolean);
    }

    const assetResults = await Promise.allSettled(
      codes.map((code) => api.getAssets(code))
    );
    const employeeResults = await Promise.allSettled(
      codes.map((code) => api.getEmployees(code))
    );
    const softwareResults = await Promise.allSettled(
      codes.map(async (code) => {
        const inventory = await api.getSoftwareInventory(code);
        const licenses = inventory?.licenses || [];
        return licenses.map((license) => ({
          ...license,
          _entityCode: code
        }));
      })
    );
    const assets = assetResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const employees = employeeResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const licenses = softwareResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    return buildDashboardData(assets || [], employees || [], licenses || [], "ALL");
  }

  const [assets, employees, softwareInventory] = await Promise.all([
    api.getAssets(entityFilter),
    api.getEmployees(entityFilter),
    api.getSoftwareInventory(entityFilter)
  ]);

  const licenses = softwareInventory?.licenses || [];
  return buildDashboardData(assets || [], employees || [], licenses || [], entityFilter);
}
