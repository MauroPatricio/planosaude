import './polyfill.js';
import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import logger from './utils/logger.js';
import { initSocket } from './utils/socket.js';

dotenv.config();

const httpServer = createServer(app);
const io = initSocket(httpServer);

const startServer = async () => {
  try {
    await connectDB();
    const port = process.env.PORT || 5000;
    httpServer.listen(port, () => {
      logger.info(`Server is running on port ${port} with Socket.io`);
    });
  } catch (error: any) {
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export { io };
