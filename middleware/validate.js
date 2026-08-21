/**
 * Wraps a Zod schema as Express middleware. On failure, responds 400 with
 * a readable list of issues instead of letting a bad request reach the
 * service layer.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'ValidationError',
        details: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = validate;
