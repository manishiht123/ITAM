const TenantManager = require("../src/utils/TenantManager");
const Entity = require("../src/models/Entity");
const defaultSequelize = require("../src/config/db");
const AssetModel = require("../src/models/Asset");

const assetId = process.argv[2];
if (!assetId) {
  console.error("Usage: node scripts/deleteAssetById.js <ASSET_ID>");
  process.exit(1);
}

const deleteFromSequelize = async (sequelize, label) => {
  const Asset = sequelize.models.Asset || AssetModel.init(sequelize);
  const deleted = await Asset.destroy({ where: { assetId } });
  console.log(`[DeleteAsset] ${label}: deleted ${deleted}`);
  return deleted;
};

const main = async () => {
  let totalDeleted = 0;

  // Default DB
  totalDeleted += await deleteFromSequelize(defaultSequelize, "default");

  // Tenant DBs from entities table
  const entities = await Entity.findAll();
  const codes = entities.map((e) => e.code).filter(Boolean);

  for (const code of codes) {
    try {
      const sequelize = await TenantManager.getConnection(code);
      totalDeleted += await deleteFromSequelize(sequelize, code);
    } catch (err) {
      console.error(`[DeleteAsset] ${code}: ${err.message}`);
    }
  }

  console.log(`[DeleteAsset] Total deleted: ${totalDeleted}`);
  await defaultSequelize.close().catch(() => {});
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
