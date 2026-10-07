let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.IO server accessed before initialization");
  }
  return ioInstance;
}

module.exports = { setIO, getIO };
