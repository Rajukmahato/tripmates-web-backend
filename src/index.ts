import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { PORT, CORS_OPTIONS } from "./configs";
import { logEnvironmentSetup } from "./utils/env-validator";
import { connectDb } from "./database/mongodb";
import app from './app';
import { initializeChatSocket } from './socket/chatSocket';

dotenv.config();

async function startServer() {
    try {
        // Log environment setup
        logEnvironmentSetup();

        // Connect to database
        console.log('🔌 Connecting to database...');
        await connectDb();
        console.log('✅ Database connected successfully');

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize Socket.io with CORS configuration from config
        console.log('📡 Initializing Socket.io...');
        const io = new Server(server, {
            cors: {
                origin: CORS_OPTIONS.origin,
                methods: CORS_OPTIONS.methods,
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            pingInterval: 25000,
            pingTimeout: 20000,
        });

        // Initialize chat socket handlers
        initializeChatSocket(io);

        // Make io accessible to Express routes
        app.set('io', io);

        // Start server
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running at: http://localhost:${PORT}`);
            console.log(`🔌 Socket.io initialized and ready`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
        });

        // Handle server errors
        server.on('error', (error: any) => {
            console.error('❌ Server error:', error);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();
