const callEventProcessor = require('packet-streamer');

// Set custom configuration
// callEventProcessor.setConfig({
  
// });

// Run the call event processor
const result = callEventProcessor.runCallEventProcessor();
console.log(result)
// log result