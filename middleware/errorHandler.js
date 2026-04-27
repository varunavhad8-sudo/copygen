const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred. Please try again or contact support.' : (err.message || 'Internal server error'),
    stack: process.env.NODE_ENV === 'development' 
      ? err.stack : undefined
  });
};

module.exports = errorHandler;



