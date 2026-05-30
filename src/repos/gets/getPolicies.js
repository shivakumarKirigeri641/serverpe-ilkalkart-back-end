const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

/* Whitelist of policy tables. This is a security allow-list (it prevents
   arbitrary table names from being interpolated into SQL) — NOT content.
   Every table here shares the same shape: id, title, description, is_active. */
const POLICY_TABLES = [
  "authenticity_policy",
  "consent_policy",
  "dispatch_policy",
  "legal_policy",
  "liability_policy",
  "notification_policy",
  "privacy_policy",
  "refund_policy",
  "replacement_policy",
  "shipping_policy",
  "terms_and_conditions",
];

/* Derive a human label from the table name, e.g.
   "terms_and_conditions" -> "Terms And Conditions". No hardcoding. */
const slugToLabel = (slug) =>
  slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/* Returns the policy categories that currently have at least one active row,
   so the front-end never links to an empty page. */
const getPolicyList = async () => {
  try {
    const checks = await Promise.all(
      POLICY_TABLES.map(async (table) => {
        const result = await pool.query(
          `select 1 from ${table} where is_active = true limit 1;`,
        );
        return result.rows.length > 0
          ? { slug: table, label: slugToLabel(table) }
          : null;
      }),
    );
    return {
      statuscode: 200,
      successstatus: true,
      message: "Policies fetched successfully",
      data: checks.filter(Boolean),
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching policies. Error: ${err.message}`,
    };
  }
};

/* Returns all active rows for a single policy category. */
const getPolicyBySlug = async (slug) => {
  try {
    if (!POLICY_TABLES.includes(slug)) {
      return {
        statuscode: 404,
        successstatus: false,
        message: "Unknown policy",
        data: null,
      };
    }
    const result = await pool.query(
      `select id, title, description from ${slug} where is_active = true order by id asc;`,
    );
    return {
      statuscode: 200,
      successstatus: true,
      message: "Policy fetched successfully",
      data: { slug, label: slugToLabel(slug), items: result.rows },
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching policy. Error: ${err.message}`,
    };
  }
};

module.exports = { getPolicyList, getPolicyBySlug, POLICY_TABLES };
