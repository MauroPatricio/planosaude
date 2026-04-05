import './polyfill.js';
import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import { checkUpcomingRenewals } from './services/automationService.js';
import logger from './utils/logger.js';
import { initSocket } from './utils/socket.js';

dotenv.config();

const httpServer = createServer(app);
const io = initSocket(httpServer);

const startServer = async () => {
  try {
    connectDB(); // Run in background
    const port = process.env.PORT || 7000;
    httpServer.listen(port, async () => {
      logger.info(`Server is running on port ${port} with Socket.io`);
      // Automation: Run checks on startup
      checkUpcomingRenewals();
    });
  } catch (error: any) {
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export { io };
