const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => ({ field: d.path.join("."), message: d.message }));
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  next();
};
module.exports = validate;
