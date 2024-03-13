const callEventProcessor = require('packet-streamer');
const config = {
    QUEUE_NAME:'streamer_queue',
    DATABASE_NAME:'streamer_database'
    // MONGODB_URL: 'mongodb://localhost:27017',
    // RABBITMQ_URL: 'amqp://localhost',
    // Other configuration options
};

const packetStreamer = new callEventProcessor(config);
packetStreamer.main().catch(console.error);
