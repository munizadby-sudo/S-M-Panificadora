/**
 * Pagination Middleware
 * Handles pagination parameters (page, limit)
 */
const paginacao = (defaultLimit = 25, maxLimit = 100) => {
  return (req, res, next) => {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || defaultLimit;

    // Validações
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > maxLimit) limit = maxLimit;

    // Calcula offset
    const offset = (page - 1) * limit;

    // Adiciona ao objeto request
    req.pagination = {
      page,
      limit,
      offset
    };

    next();
  };
};

module.exports = {
  paginacao
};
