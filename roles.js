const requireManager = (req, res, next) => {
  if (req.user["custom:Role"] !== "manager") {
    return res.status(403).json({ error: "Access denied. Managers only." });
  }
  next();
};

const requireEmployee = (req, res, next) => {
  if (!req.user["custom:Role"]) {
    return res.status(403).json({ error: "Access denied. Must be logged in." });
  }
  next();
};

module.exports = { requireManager, requireEmployee };