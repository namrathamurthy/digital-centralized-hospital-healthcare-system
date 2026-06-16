function getIo() {
  return global.io;
}

function broadcastEvent(event, data) {
  const io = getIo();
  if (io) {
    io.emit(event, data);
    console.log(`[SOCKET BROADCAST] Event: ${event}`, data);
  } else {
    console.log(`[SOCKET WARN] Global IO not available. Broadcast skipped for: ${event}`);
  }
}

function emitToRoom(room, event, data) {
  const io = getIo();
  if (io) {
    io.to(room).emit(event, data);
    console.log(`[SOCKET ROOM: ${room}] Event: ${event}`, data);
  } else {
    console.log(`[SOCKET WARN] Global IO not available. Room emit skipped for ${room}: ${event}`);
  }
}

module.exports = {
  getIo,
  broadcastEvent,
  emitToRoom
};
