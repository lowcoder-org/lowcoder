#!/usr/bin/env node

/**
 * Simple Yjs WebSocket Server for Testing
 * 
 * This server enables real-time synchronization between multiple browser tabs
 * using Yjs documents and WebSocket connections.
 * 
 * Usage: node yjs-websocket-server.cjs
 */

const { WebSocketServer } = require('ws');
const http = require('http');
const { setupWSConnection } = require('@y/websocket-server/utils');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting Yjs WebSocket Server...');
console.log(`📡 Server will run on: ws://${HOST}:${PORT}`);

// Create HTTP server
const server = http.createServer((request, response) => {
  // Enable CORS for all origins
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Simple health check endpoint
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ 
      status: 'healthy', 
      server: 'yjs-websocket',
      timestamp: new Date().toISOString(),
      connections: wss ? wss.clients.size : 0
    }));
    return;
  }
  
  response.writeHead(404);
  response.end('Not found');
});

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  // Enable proper WebSocket upgrade handling
  perMessageDeflate: false
});

console.log('🔌 WebSocket server created');

// Track active connections and documents
const activeConnections = new Map();
const activeDocuments = new Set();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const url = req.url || '/';
  const roomId = url.substring(1) || 'default'; // Extract room ID from URL path
  
  console.log(`🔗 New WebSocket connection: ${url} (Room: ${roomId})`);
  console.log(`📊 Total connections: ${wss.clients.size}`);
  
  // Track this connection
  activeConnections.set(ws, {
    roomId,
    connectedAt: Date.now(),
    url
  });
  
  activeDocuments.add(roomId);
  
  // Set up Yjs document synchronization
  try {
    setupWSConnection(ws, req, {
      // Optional: Add custom document persistence or cleanup
      gc: true // Enable garbage collection
    });
    console.log(`✅ Yjs synchronization setup complete for room: ${roomId}`);
  } catch (error) {
    console.error(`❌ Failed to setup Yjs connection for room ${roomId}:`, error);
    ws.close(1011, 'Failed to setup synchronization');
  }
  
  // Handle connection close
  ws.on('close', (code, reason) => {
    const connectionInfo = activeConnections.get(ws);
    console.log(`🔌 WebSocket disconnected: ${connectionInfo?.roomId || 'unknown'} (Code: ${code}, Reason: ${reason})`);
    activeConnections.delete(ws);
    console.log(`📊 Remaining connections: ${wss.clients.size}`);
  });
  
  // Handle connection errors
  ws.on('error', (error) => {
    const connectionInfo = activeConnections.get(ws);
    console.error(`❌ WebSocket error for room ${connectionInfo?.roomId || 'unknown'}:`, error);
  });
});

// Handle server events
wss.on('error', (error) => {
  console.error('❌ WebSocket server error:', error);
});

server.on('error', (error) => {
  console.error('❌ HTTP server error:', error);
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log('✅ Yjs WebSocket Server is running!');
  console.log(`📡 WebSocket endpoint: ws://${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  console.log('');
  console.log('🧪 Testing Instructions:');
  console.log('1. Open multiple browser tabs with ChatBox components');
  console.log('2. Use the same Room ID in all tabs');
  console.log('3. Send messages and watch them sync in real-time!');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Periodic status logging
setInterval(() => {
  if (wss.clients.size > 0) {
    console.log(`📊 Status: ${wss.clients.size} active connections, ${activeDocuments.size} active documents`);
    console.log(`🏠 Active rooms: ${Array.from(activeDocuments).join(', ')}`);
  }
}, 30000); // Log every 30 seconds

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Yjs WebSocket Server...');
  
  // Close all WebSocket connections
  wss.clients.forEach(ws => {
    ws.close(1001, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  
  // Close all WebSocket connections
  wss.clients.forEach(ws => {
    ws.close(1001, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('✅ Server stopped gracefully');
    process.exit(0);
  });
}); 