import ofbusinessLogo from "../assets/logos/default.svg";
import oxyzoLogo from "../assets/logos/oxyzo.svg";
import defaultLogo from "../assets/logos/default.svg";

export const ENTITY_LOGOS = {
  OFBUSINESS: ofbusinessLogo,
  OXYZO: oxyzoLogo
};

export const getEntityLogo = (entity) => {
  if (!entity) return defaultLogo;
  return ENTITY_LOGOS[entity.toUpperCase()] || defaultLogo;
};

