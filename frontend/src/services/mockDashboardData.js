export function getMockDashboardData(entityId) {
  return {
    entity: entityId,

    assets: {
      total: 1250,
      allocated: 910,
      available: 220,
      repair: 65,
      retired: 55,
      statusBreakdown: [
        { name: "In Use", value: 910 },
        { name: "In Stock", value: 220 },
        { name: "Under Maintenance", value: 65 },
        { name: "Retired", value: 55 },
      ],
    },

    licenses: {
      total: 600,
      used: 520,
      available: 60,
      overused: 20,
      expiring: 35,
      usageBreakdown: [
        { name: "Used", value: 520 },
        { name: "Available", value: 60 },
        { name: "Over-allocated", value: 20 },
      ],
    },

    alerts: [
      { title: "Licenses Expiring (30 days)", count: 12, severity: "high" },
      { title: "Assets Out of Warranty", count: 28, severity: "high" },
      { title: "Unassigned Assets", count: 45, severity: "medium" },
      { title: "Inactive Assets", count: 18, severity: "low" },
    ],

    trends: {
      assetGrowth: [
        { month: "Jan", value: 980 },
        { month: "Feb", value: 1020 },
        { month: "Mar", value: 1080 },
        { month: "Apr", value: 1150 },
        { month: "May", value: 1200 },
        { month: "Jun", value: 1250 },
      ],
      licenseUsage: [
        { month: "Jan", value: 410 },
        { month: "Feb", value: 450 },
        { month: "Mar", value: 480 },
        { month: "Apr", value: 500 },
        { month: "May", value: 520 },
        { month: "Jun", value: 520 },
      ],
      repairVsReplace: [
        { month: "Jan", repair: 12, replace: 4 },
        { month: "Feb", repair: 18, replace: 6 },
        { month: "Mar", repair: 15, replace: 5 },
        { month: "Apr", repair: 20, replace: 8 },
        { month: "May", repair: 14, replace: 6 },
        { month: "Jun", repair: 10, replace: 4 },
      ],
    },

    tables: [
      {
        title: "Recently Added Assets",
        columns: ["Asset Tag", "Category", "Entity"],
        rows: [
          ["LAP-3421", "Laptop", "OFB"],
          ["SRV-1299", "Server", "OXYZO"],
          ["MOB-8891", "Mobile", "OFB"],
        ],
      },
      {
        title: "Assets Needing Attention",
        columns: ["Asset Tag", "Issue", "Priority"],
        rows: [
          ["LAP-2211", "Warranty Expired", "High"],
          ["NET-1180", "Under Repair", "Medium"],
          ["SRV-7742", "EOL Approaching", "High"],
        ],
      },
    ],
  };
}

