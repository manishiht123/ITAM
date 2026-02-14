const fs = require("fs");
const path = require("path");
const sequelize = require("../config/db");

const TABLES_TO_EXPORT = [
  "Assets",
  "AssetCategories",
  "Employees",
  "Departments",
  "Locations",
  "SoftwareLicenses",
  "SoftwareAssignments",
  "Entities",
  "Users",
  "AuditLogs"
];

function ensureDir(dir) {
  const resolved = path.resolve(dir);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }
  return resolved;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

/**
 * Generate a SQL dump using Sequelize queries (no mysqldump dependency)
 */
async function dumpDatabase(backupDir) {
  const dir = ensureDir(backupDir);
  const filename = `db_backup_${timestamp()}.sql`;
  const filePath = path.join(dir, filename);
  const dbName = process.env.DB_NAME || "itamdb";

  const lines = [];
  lines.push(`-- ITAM Database Backup`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Database: ${dbName}`);
  lines.push("");
  lines.push(`SET FOREIGN_KEY_CHECKS = 0;`);
  lines.push("");

  for (const table of TABLES_TO_EXPORT) {
    try {
      // Get CREATE TABLE statement
      const [[createResult]] = await sequelize.query(`SHOW CREATE TABLE \`${table}\``);
      const createStmt = createResult["Create Table"];
      if (createStmt) {
        lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
        lines.push(`${createStmt};`);
        lines.push("");
      }

      // Get all rows
      const [rows] = await sequelize.query(`SELECT * FROM \`${table}\``);
      if (rows.length) {
        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `\`${c}\``).join(", ");

        for (const row of rows) {
          const values = columns.map((c) => {
            const val = row[c];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number") return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
            return `'${String(val).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
          });
          lines.push(`INSERT INTO \`${table}\` (${colList}) VALUES (${values.join(", ")});`);
        }
        lines.push("");
      }
    } catch (err) {
      lines.push(`-- Skipped table ${table}: ${err.message}`);
      lines.push("");
    }
  }

  lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
  lines.push("");

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  const stats = fs.statSync(filePath);

  return {
    filename,
    path: filePath,
    size: stats.size,
    type: "database"
  };
}

/**
 * Export all key tables as CSV files into a subfolder
 */
async function exportCsv(backupDir) {
  const dir = ensureDir(backupDir);
  const folderName = `csv_backup_${timestamp()}`;
  const csvDir = path.join(dir, folderName);
  fs.mkdirSync(csvDir, { recursive: true });

  const files = [];

  for (const table of TABLES_TO_EXPORT) {
    try {
      const [rows] = await sequelize.query(`SELECT * FROM \`${table}\``);
      if (!rows.length) continue;

      const headers = Object.keys(rows[0]);
      const csvLines = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
      ];

      const filename = `${table}.csv`;
      fs.writeFileSync(path.join(csvDir, filename), csvLines.join("\n"), "utf8");
      files.push(filename);
    } catch (err) {
      // Table may not exist yet, skip it
      console.warn(`Skipping table ${table}: ${err.message}`);
    }
  }

  // Create a zip-like summary file
  const manifest = {
    created: new Date().toISOString(),
    tables: files,
    totalTables: files.length
  };
  fs.writeFileSync(
    path.join(csvDir, "_manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  return {
    filename: folderName,
    path: csvDir,
    size: files.length,
    type: "csv",
    tables: files
  };
}

/**
 * Run backup based on type preference
 */
async function runBackup(backupType, backupLocation) {
  const dir = backupLocation || "./backups";
  const results = [];

  if (backupType === "database" || backupType === "both") {
    const dbResult = await dumpDatabase(dir);
    results.push(dbResult);
  }

  if (backupType === "csv" || backupType === "both") {
    const csvResult = await exportCsv(dir);
    results.push(csvResult);
  }

  return results;
}

/**
 * List existing backups in the backup directory
 */
function listBackups(backupLocation) {
  const dir = path.resolve(backupLocation || "./backups");
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const backups = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && entry.name.endsWith(".sql")) {
      const stats = fs.statSync(fullPath);
      backups.push({
        filename: entry.name,
        type: "database",
        size: stats.size,
        created: stats.mtime.toISOString()
      });
    } else if (entry.isDirectory() && entry.name.startsWith("csv_backup_")) {
      const stats = fs.statSync(fullPath);
      const manifestPath = path.join(fullPath, "_manifest.json");
      let tables = 0;
      if (fs.existsSync(manifestPath)) {
        try {
          const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
          tables = m.totalTables || 0;
        } catch (_) {}
      }
      backups.push({
        filename: entry.name,
        type: "csv",
        size: tables,
        created: stats.mtime.toISOString()
      });
    }
  }

  return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
}

/**
 * Delete backups older than retentionDays
 */
function cleanOldBackups(backupLocation, retentionDays) {
  const dir = path.resolve(backupLocation || "./backups");
  if (!fs.existsSync(dir)) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  let removed = 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const stats = fs.statSync(fullPath);

    if (stats.mtime < cutoff) {
      if (entry.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      removed++;
    }
  }

  return removed;
}

module.exports = { runBackup, listBackups, cleanOldBackups, dumpDatabase, exportCsv };
