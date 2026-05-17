// Allows only managers
const requireManager = () => (req, res, next) => {
  if (req.user['custom:role'] !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

// Allows managers and employees
const requireEmployee = () => (req, res, next) => {
  const role = req.user['custom:role'];
  if (role !== 'employee' && role !== 'manager') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

module.exports = { requireManager, requireEmployee };
