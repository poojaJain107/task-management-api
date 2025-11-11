require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config/config');
const { connectDB } = require('./src/config/database');

const start = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`✓ Server is running on port ${config.port}`);
      console.log(`✓ Environment: ${config.environment}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

start();
