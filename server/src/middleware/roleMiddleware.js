// Returns middleware that restricts access to users whose role matches one of the provided values.
// Must be used after the protect middleware (relies on req.user being set).
// Returns 403 if the authenticated user does not have an allowed role.
export const requireRole = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
