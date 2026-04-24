const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
};

const errorHandler = (error, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (error.name === "CastError") {
    statusCode = 400;
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
  }

  if (
    error.name === "MulterError" ||
    error.message === "Only image and PDF files are allowed" ||
    error.message === "Only image files are allowed for suspect and timeline uploads"
  ) {
    statusCode = 400;
  }

  if (error.code === 11000) {
    statusCode = 409;
  }

  if (error.isAxiosError && error.response) {
    statusCode = error.response.status || 502;
  }

  return res.status(statusCode).json({
    message:
      error.code === 11000
        ? "Duplicate key error"
        : error.isAxiosError && error.response?.data?.message
          ? error.response.data.message
        : error.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

export { errorHandler, notFound };