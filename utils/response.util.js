const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    status: 'success',
    message,
    data,
    statusCode
  };
};

const errorResponse = (message = 'Error occurred', statusCode = 500, errors = null) => {
  return {
    status: 'error',
    message,
    errors,
    statusCode
  };
};


const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export { successResponse, errorResponse, createError }; 