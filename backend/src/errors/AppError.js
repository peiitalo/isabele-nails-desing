/**
 * AppError – lightweight error class for known, handleable errors.
 * Services throw these; controllers catch and map them to HTTP responses.
 */
export class AppError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (4xx / 5xx)
   * @param {string} message     - Human-readable error message
   */
  constructor(statusCode, message) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}
