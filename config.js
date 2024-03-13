module.exports = {
    QUEUE_NAME: process.env.QUEUE_NAME || 'gradient_call_log',
    RETRY_QUEUE_NAME: process.env.RETRY_QUEUE_NAME || 'streamer_retry',
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017',
    DATABASE_NAME: process.env.DATABASE_NAME || 'record',
    MAX_POOL_SIZE: process.env.MAX_POOL_SIZE || 5,
    MAX_RETRY_COUNT: process.env.MAX_RETRY_COUNT || 3,
    RETRY_TIMEOUT_MS: process.env.RETRY_TIMEOUT_MS || 5000,
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost',
    NUM_WORKERS: process.env.NUM_WORKERS || 4,
    MAX_CONNECTION_RETRY_COUNT:process.env.MAX_CONNECTION_RETRY_COUNT || 5,
    INITIAL_RETRY_DELAY_MS:process.env.INITIAL_RETRY_DELAY_MS || 1000,
    NUM_OF_WORKER:process.env.NUM_OF_WORKER || 4,
    COLLECTION_NAME:process.env.COLLECTION_NAME || "event"
};