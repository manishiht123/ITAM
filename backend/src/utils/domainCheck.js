/**
 * isDomainAllowed — checks whether an email's domain is in the allowed list.
 *
 * @param {string} email               - The user's email address.
 * @param {string} allowedDomainsStr   - Comma-separated list of permitted domains
 *                                       (e.g. "company.com,subsidiary.org").
 *                                       Empty string / null means no restriction.
 * @returns {boolean}
 */
function isDomainAllowed(email, allowedDomainsStr) {
  // Empty / null config → no restriction
  if (!allowedDomainsStr || allowedDomainsStr.trim() === "") return true;

  const domain = (email || "").split("@")[1]?.toLowerCase();
  if (!domain) return false;

  const allowed = allowedDomainsStr
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(domain);
}

module.exports = { isDomainAllowed };
