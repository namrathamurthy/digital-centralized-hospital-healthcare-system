// MUST be first - disable Turbopack before any require() loads Next.js internals
process.env.NEXT_PRIVATE_DISABLE_TURBOPACK = '1';
process.env.TURBOPACK = '0';

require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();


const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Share Socket.IO server globally to make it accessible in API routes
  global.io = io;

  io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> SmartCare Server running on http://localhost:${port} in ${dev ? 'development' : 'production'} mode`);
  });
});
