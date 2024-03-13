// index.js

const { Worker, isMainThread } = require('worker_threads');
const amqp = require('amqplib');
const { MongoClient } = require('mongodb');
let config = require('./config');
class PacketStreamer {

    constructor(config) {
        this.config = config;
        this.client = null; // Define client as a class property
        this.connectionRetryCount=0;
        this.channel=null;
        this.retryDelay = config.INITIAL_RETRY_DELAY_MS;
    }

    async createClient() {
        return MongoClient.connect(this.config.MONGODB_URL?this.config.MONGODB_URL:config.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    async initializeMongoDBPool() {
        this.client = await this.createClient();
        console.log('Connected to MongoDB');
    }

    async createConnection() {
        try {
            const connection = await amqp.connect(this.config.RABBITMQ_URL?this.config.RABBITMQ_URL:config.RABBITMQ_URL);
            connection.on('error', this.handleConnectionError);

            this.channel = await connection.createChannel();
            await this.channel.assertQueue(this.config.QUEUE_NAME?this.config.QUEUE_NAME:config.QUEUE_NAME);
            console.log('Connected to RabbitMQ');
            this.resetConnectionRetry();
        } catch (error) {
            console.error('Error creating RabbitMQ connection:', error);
            if (this.connectionRetryCount < this.config.MAX_CONNECTION_RETRY_COUNT?this.config.MAX_CONNECTION_RETRY_COUNT:config.MAX_CONNECTION_RETRY_COUNT) {
                await this.retryConnection();
            } else {
                console.error('Maximum connection retry count reached. Exiting.');
                process.exit(1);
            }
        }
    }

    handleConnectionError(err) {
        console.error('RabbitMQ connection error:', err);
        this.retryConnection();
    }

    async retryConnection() {
        console.log(`Retrying connection to RabbitMQ. Attempt ${this.connectionRetryCount + 1} of ${this.config.MAX_CONNECTION_RETRY_COUNT?this.config.MAX_CONNECTION_RETRY_COUNT:config.MAX_CONNECTION_RETRY_COUNT}`);
        this.connectionRetryCount++;
        const delay = Math.min(this.retryDelay, 30000); // Cap the maximum delay to 30 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
        this.retryDelay *= 2; // Exponential backoff
        await this.createConnection();
    }

    resetConnectionRetry() {
        this.retryDelay = this.config.INITIAL_RETRY_DELAY_MS?this.config.INITIAL_RETRY_DELAY_MS:config.INITIAL_RETRY_DELAY_MS;
        this.connectionRetryCount = 0;
    }

    async consumeMessages() {
        try {
            await this.channel.prefetch(100);
            this.channel.consume(this.config.QUEUE_NAME?this.config.QUEUE_NAME:config.QUEUE_NAME, async (msg) => {
                if (msg !== null) {
                    const data = JSON.parse(msg.content.toString());
                    console.log(data)
                    await this.processMessage(data);
                    this.channel.ack(msg);
                }
            });
        } catch (error) {
            console.error('Error consuming messages:', error);
            process.exit(1);
        }
    }

    async processMessage(data) {
        try {
            const { call_start } = data.body;
            //const COLLECTION_NAME = `call_event_${call_start.call_id}`;
            const db = this.client.db(this.config.DATABASE_NAME?this.config.DATABASE_NAME:config.DATABASE_NAME);
            const collection = db.collection(this.config.COLLECTION_NAME?this.config.COLLECTION_NAME:config.COLLECTION_NAME);
            await this.storeDataInMongoDB(collection, call_start);
        } catch (error) {
            console.error('Error processing message:', error);
            this.pushToRetryQueue(data);
        }
    }

    async storeDataInMongoDB(collection, call_start) {
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

    async pushToRetryQueue(data) {
        try {
            await this.channel.assertQueue(this.config.RETRY_QUEUE_NAME?this.config.RETRY_QUEUE_NAME:config.RETRY_QUEUE_NAME);
            await this.channel.sendToQueue(this.config.RETRY_QUEUE_NAME?this.config.RETRY_QUEUE_NAME:config.RETRY_QUEUE_NAME, Buffer.from(JSON.stringify(data)));
            console.log('Pushed to retry queue:');
        } catch (error) {
            console.error('Error pushing to retry queue:', error);
        }
    }

    async retryFailedOperations() {
        try {
            await this.channel.assertQueue(this.config.RETRY_QUEUE_NAME?this.config.RETRY_QUEUE_NAME:config.RETRY_QUEUE_NAME);
            this.channel.consume(this.config.RETRY_QUEUE_NAME?this.config.RETRY_QUEUE_NAME:config.RETRY_QUEUE_NAME, async (msg) => {
                if (msg !== null) {
                    const data = JSON.parse(msg.content.toString());
                    await new Promise(resolve => setTimeout(resolve, this.config.RETRY_TIMEOUT_MS?this.config.RETRY_TIMEOUT_MS:config.RETRY_TIMEOUT_MS));
                    mongoQueue.push(data);
                    await this.processMongoQueue();
                    this.channel.ack(msg);
                }
            });
        } catch (error) {
            console.error('Error consuming from retry queue:', error);
            await new Promise(resolve => setTimeout(resolve, this.config.RETRY_TIMEOUT_MS?this.config.RETRY_TIMEOUT_MS:config.RETRY_TIMEOUT_MS));
            this.retryFailedOperations();
        }
    }

    async processMongoQueue() {
        while (mongoQueue.length > 0) {
            const data = mongoQueue.shift();
            try {
                const db = this.client.db(this.config.DATABASE_NAME?this.config.DATABASE_NAME:config.DATABASE_NAME);
                const collection = db.collection(this.config.COLLECTION_NAME?this.config.COLLECTION_NAME:config.COLLECTION_NAME);
                await this.storeDataInMongoDB(collection, data);
            } catch (error) {
                console.error('Error processing MongoDB operation:', error);
                if (data.retryCount < this.config.MAX_RETRY_COUNT?this.config.MAX_RETRY_COUNT:config.MAX_RETRY_COUNT) {
                    mongoQueue.push({ ...data, retryCount: (data.retryCount || 0) + 1 });
                } else {
                    console.error('Maximum retry count reached. Discarding message:', error);
                    this.pushToRetryQueue(data);
                }
            }
        }
    }

    async main() {
        console.log(this.config)
        await this.initializeMongoDBPool();
        await this.createConnection();
        await this.consumeMessages();
        await this.retryFailedOperations();
        if (isMainThread) {
            const numWorkers = this.config.NUM_WORKERS?this.config.NUM_WORKERS:config.NUM_WORKERS;
            for (let i = 0; i < numWorkers; i++) {
                new Worker(__filename);
            }
        }
    }

}

module.exports = PacketStreamer;
