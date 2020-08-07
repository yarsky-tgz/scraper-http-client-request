class EntityError extends Error {
  constructor(message, retryable = true) {
    super(message)
    this.name = 'EntityError'
    this.retryable = retryable
  }
}

module.exports = EntityError
