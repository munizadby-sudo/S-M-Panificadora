/**
 * Logger Service
 * Handles application logging
 */

const logger = {
  log: (message, meta = {}) => {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`, meta);
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
  },
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta);
  }
};

const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

const logErro = (message, error = null) => {
  logger.error(message, error);
};

const logRequisicao = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};

module.exports = {
  logger,
  logInfo,
  logErro,
  logRequisicao
};
