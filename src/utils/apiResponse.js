function ok(res, data, statusCode = 200, meta) {
  return res.status(statusCode).json(meta ? { success: true, data, meta } : { success: true, data });
}

function created(res, data) {
  return ok(res, data, 201);
}

function noContent(res) {
  return res.status(204).send();
}

module.exports = { ok, created, noContent };
