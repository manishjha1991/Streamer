# Streamer

## Worker Threads and RabbitMQ Message Consumer

This Node.js script establishes connections with MongoDB and RabbitMQ to consume and process call event messages. It utilizes worker threads for concurrent processing.

### Features
- **MongoDB Integration:** Connects to a MongoDB database to store call event data.
- **RabbitMQ Integration:** Establishes a connection to RabbitMQ for message consumption.
- **Concurrency:** Utilizes worker threads for concurrent message processing.
- **Retry Mechanism:** Implements a retry mechanism for failed MongoDB operations.

### Dependencies
- `worker_threads`: Node.js module for creating and managing worker threads.
- `amqplib`: Library for interacting with RabbitMQ.
- `mongodb`: MongoDB driver for Node.js.

### Configuration
- `MONGODB_URL`: URL for connecting to MongoDB.
- `QUEUE_NAME`: Name of the RabbitMQ queue for consuming call event messages.
- `RETRY_QUEUE_NAME`: Name of the RabbitMQ queue for retrying failed operations.
- `MAX_RETRY_COUNT`: Maximum number of retry attempts for failed MongoDB operations.
- `RETRY_TIMEOUT_MS`: Timeout duration for retrying failed operations.
- `MAX_CONNECTION_RETRY_COUNT`: Maximum number of retry attempts for establishing connections.

### Usage
1. Ensure MongoDB and RabbitMQ servers are running.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Update the configuration variables in the script, if necessary.
4. Run the script:

   ```bash
   npm start
   ```

### Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.

### License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### Acknowledgements
- Thanks to the authors of `amqplib` and `mongodb` for their excellent libraries.
- Inspiration from similar projects and tutorials.

Feel free to adjust the content to better fit your project's specifics and requirements.
