// index.js

const { Worker, isMainThread } = require('worker_threads');
const amqp = require('amqplib');
const { MongoClient } = require('mongodb');
let config = require('./config');

// Function to set custom configuration
function setConfig(newConfig) {
    config = { ...config, ...newConfig };
}

async function createClient() {
    return MongoClient.connect(config.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function initializeMongoDBPool() {
    client = await createClient();
    console.log('Connected to MongoDB');
}

async function createConnection() {
    try {
        const connection = await amqp.connect(config.RABBITMQ_URL);
        connection.on('error', handleConnectionError);

        channel = await connection.createChannel();
        await channel.assertQueue(config.QUEUE_NAME);
        console.log('Connected to RabbitMQ');
        resetConnectionRetry();
    } catch (error) {
        console.error('Error creating RabbitMQ connection:', error);
        if (connectionRetryCount < config.MAX_CONNECTION_RETRY_COUNT) {
            await retryConnection();
        } else {
            console.error('Maximum connection retry count reached. Exiting.');
            process.exit(1);
        }
    }
}

function handleConnectionError(err) {
    console.error('RabbitMQ connection error:', err);
    retryConnection();
}

async function retryConnection() {
    console.log(`Retrying connection to RabbitMQ. Attempt ${connectionRetryCount + 1} of ${config.MAX_CONNECTION_RETRY_COUNT}`);
    connectionRetryCount++;
    const delay = Math.min(retryDelay, 30000); // Cap the maximum delay to 30 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    retryDelay *= 2; // Exponential backoff
    await createConnection();
}

function resetConnectionRetry() {
    retryDelay = config.INITIAL_RETRY_DELAY_MS;
    connectionRetryCount = 0;
}

async function consumeMessages() {
    try {
        await channel.prefetch(100);
        channel.consume(config.QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                await processMessage(data);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error consuming messages:', error);
        process.exit(1);
    }
}

async function processMessage(data) {
    try {
        const { call_start } = data.body;
        const COLLECTION_NAME = `call_event_${call_start.call_id}`;
        const db = client.db(config.DATABASE_NAME);
        const collection = db.collection(config.COLLECTION_NAME);
        await storeDataInMongoDB(collection, call_start);
    } catch (error) {
        console.error('Error processing message:', error);
        pushToRetryQueue(data);
    }
}

async function storeDataInMongoDB(collection, call_start) {
    try {
        // if (Math.random() < 0.5) { // Adjust the probability as needed
        //     throw new Error('Intentional error for testing retry mechanism');
        // }
        await collection.insertOne({ ...call_start });
        console.log('Data stored in MongoDB:');
    } catch (error) {
        console.error('Error storing data in MongoDB:', error);
        throw error; // Propagate the error for retry mechanism
    }
}

async function pushToRetryQueue(data) {
    try {
        await channel.assertQueue(config.RETRY_QUEUE_NAME);
        await channel.sendToQueue(config.RETRY_QUEUE_NAME, Buffer.from(JSON.stringify(data)));
        console.log('Pushed to retry queue:');
    } catch (error) {
        console.error('Error pushing to retry queue:', error);
    }
}

async function retryFailedOperations() {
    try {
        await channel.assertQueue(config.RETRY_QUEUE_NAME);
        channel.consume(config.RETRY_QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                await new Promise(resolve => setTimeout(resolve, config.RETRY_TIMEOUT_MS));
                mongoQueue.push(data);
                await processMongoQueue();
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error consuming from retry queue:', error);
        await new Promise(resolve => setTimeout(resolve, config.RETRY_TIMEOUT_MS));
        retryFailedOperations();
    }
}

async function processMongoQueue() {
    while (mongoQueue.length > 0) {
        const data = mongoQueue.shift();
        try {
            const db = client.db(config.DATABASE_NAME);
            const collection = db.collection(config.COLLECTION_NAME);
            await storeDataInMongoDB(collection, data);
        } catch (error) {
            console.error('Error processing MongoDB operation:', error);
            if (data.retryCount < config.MAX_RETRY_COUNT) {
                mongoQueue.push({ ...data, retryCount: (data.retryCount || 0) + 1 });
            } else {
                console.error('Maximum retry count reached. Discarding message:', error);
                pushToRetryQueue(data);
            }
        }
    }
}

async function main() {
    await initializeMongoDBPool();
    await createConnection();
    await consumeMessages();
    await retryFailedOperations();
    if (isMainThread) {
        const numWorkers = config.NUM_WORKERS;
        for (let i = 0; i < numWorkers; i++) {
            new Worker(__filename);
        }
    }
}



// Export functions or objects for customization
module.exports = {
    setConfig,
    main
};
