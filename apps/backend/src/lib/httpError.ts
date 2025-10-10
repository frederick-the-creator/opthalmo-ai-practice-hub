export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    Error.captureStackTrace?.(this, HttpError)
  }

  static BadRequest(msg = 'Bad Request') {
    return new HttpError(400, msg)
  }
  static Unauthorized(msg = 'Unauthorized') {
    return new HttpError(401, msg)
  }
  static Forbidden(msg = 'Forbidden') {
    return new HttpError(403, msg)
  }
  static NotFound(msg = 'Not Found') {
    return new HttpError(404, msg)
  }
  static Internal(msg = 'Internal Server Error') {
    return new HttpError(500, msg)
  }
}