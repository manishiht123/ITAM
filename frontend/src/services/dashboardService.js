import { getMockDashboardData } from "./mockDashboardData";

/**
 * TEMP: synchronous mock service
 * (Docker + Vite safe)
 */
export function getDashboardData(entityId) {
  console.log("Dashboard mock data used for entity:", entityId);
  return getMockDashboardData(entityId);
}

