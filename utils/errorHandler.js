function handleError(res, error, message = "An error occurred", statusCode = 500) {
    console.error(error); 
    res.status(statusCode).json({
      message: message,
      error: error.message || error,
    });
    
  }
  
  module.exports = handleError;