import ofbusinessLogo from "../assets/logos/default.svg";
import ofbusinessLogoDark from "../assets/logos/default-dark.svg";

// Light-mode logo map (key = entity code, UPPERCASE)
// Only add entities here when a curated file logo should OVERRIDE the DB-uploaded logo.
// Entities that upload their own logo via Settings should NOT be listed here.
export const ENTITY_LOGOS = {
  OFBUSINESS:     ofbusinessLogo,
  OFB:            ofbusinessLogo,
  OFBTECH:        ofbusinessLogo,
  OFBTECHLIMITED: ofbusinessLogo
};

// Dark-mode logo map — add a dark variant here when one exists
export const ENTITY_LOGOS_DARK = {
  OFBUSINESS:     ofbusinessLogoDark,
  OFB:            ofbusinessLogoDark,
  OFBTECH:        ofbusinessLogoDark,
  OFBTECHLIMITED: ofbusinessLogoDark
};

/**
 * Returns the curated file-based logo for an entity code + theme.
 * Returns null if the entity code is not in the config — caller
 * should then fall back to the DB logo or the OFB default.
 */
export const getEntityLogoForTheme = (entityCode, theme) => {
  if (!entityCode) return null;
  const code = entityCode.toUpperCase().replace(/[\s_-]/g, "");
  const map = theme === "dark" ? ENTITY_LOGOS_DARK : ENTITY_LOGOS;
  return map[code] || null;
};

// Legacy helper kept for backward compatibility
export const getEntityLogo = (entity) => {
  if (!entity) return ofbusinessLogo;
  return ENTITY_LOGOS[entity.toUpperCase()] || ofbusinessLogo;
};
