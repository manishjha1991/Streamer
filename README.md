# Streamer

## Worker Threads and RabbitMQ Message Consumer

This Node.js script establishes connections with MongoDB and RabbitMQ to consume and process  event messages. It utilizes worker threads for concurrent processing.

### Features
- **MongoDB Integration:** Connects to a MongoDB database to store  event data.
- **RabbitMQ Integration:** Establishes a connection to RabbitMQ for message consumption.
- **Concurrency:** Utilizes worker threads for concurrent message processing.
- **Retry Mechanism:** Implements a retry mechanism for failed MongoDB operations.

### Dependencies
- `worker_threads`: Node.js module for creating and managing worker threads.
- `amqplib`: Library for interacting with RabbitMQ.
- `mongodb`: MongoDB driver for Node.js.

To update the README file with the additional configurations and environment variables, you can include descriptions of each configuration variable and how they are used in the application. Here's a suggested format:

---

# Event Processing Application

This Node.js application processes  events by consuming messages from RabbitMQ, storing data in MongoDB, and handling retries for failed operations.

## Configuration

The application uses the following configuration variables, which can be set via environment variables or defaults to the provided values:

- `QUEUE_NAME`: Name of the RabbitMQ queue for consuming  event messages. Default: `'streamer_queue'`.
- `RETRY_QUEUE_NAME`: Name of the RabbitMQ queue for retrying failed operations. Default: `'streamer_retry'`.
- `MONGODB_URL`: URL for connecting to MongoDB. Default: `'mongodb://localhost:27017'`.
- `DATABASE_NAME`: Name of the MongoDB database to store  records. Default: `'record'`.
- `MAX_POOL_SIZE`: Maximum pool size for MongoDB connections. Default: `5`.
- `MAX_RETRY_COUNT`: Maximum number of retry attempts for failed MongoDB operations. Default: `3`.
- `RETRY_TIMEOUT_MS`: Timeout duration (in milliseconds) for retrying failed operations. Default: `5000`.
- `RABBITMQ_URL`: URL for connecting to RabbitMQ. Default: `'amqp://localhost'`.
- `NUM_WORKERS`: Number of worker threads to spawn for processing messages. Default: `4`.
- `MAX_CONNECTION_RETRY_COUNT`: Maximum number of retry attempts for establishing connections. Default: `5`.
- `INITIAL_RETRY_DELAY_MS`: Initial retry delay (in milliseconds) for connection retries. Default: `1000`.
- `NUM_OF_WORKER`: Number of worker threads to spawn for processing messages. Default: `4`.
- `COLLECTION_NAME`: Name of the MongoDB collection to store  events. Default: `'event'`.


### Usage
1. Ensure MongoDB and RabbitMQ servers are running.
2. Install dependencies:

   ```bash
   npm install packet-streamer -- save
   ```

3. Update the configuration variables in the script, if necessary.
4. Import Package then use 
   ```
   const EventProcessor = require('packet-streamer');

   // Set custom configuration
   EventProcessor.setConfig({
      QUEUE_NAME: 'custom_queue_name',
      MONGODB_URL: 'custom_mongodb_url',
      RABBITMQ_URL:'custom_rmq_url'
      RETRY_QUEUE_NAME: 'delay_custom_queue_name',
      DATABASE_NAME:'custom'
      // ... other configuration
   });

   // Run the  event processor
   const result = EventProcessor.main();
   // log result 
   ```
### Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

### License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### Acknowledgements
- Thanks to the authors of `amqplib` and `mongodb` for their excellent libraries.
- Inspiration from similar projects and tutorials.

Feel free to adjust the content to better fit your project's specifics and requirements.
