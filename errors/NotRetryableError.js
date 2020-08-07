class NotRetryableError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotRetryableError'
  }
}

module.exports = NotRetryableError
