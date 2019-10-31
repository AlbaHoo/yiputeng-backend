const lodash = require('lodash');
const BOARD_TYPE_BYTE = 0;
const FRAME_LENGTH1 = 2;
const FRAME_LENGTH2 = 3;
const MIN_LENGTH = 10;

const FRAME_END = [0x0D, 0x0A]

const buf = require('../example/status/upload1.js');

function Frame(buffer = buf) {
  this.buffer = buffer;
  if (buf.length < MIN_LENGTH) {
    return;
  }
  this.boardType = buffer[0];
  this.frameType = buffer[1];
  this.boardId = buffer.slice(4, 19).toString('ascii');
  this.softwareVersion = buffer.slice(19, 34).toString('ascii');
  const [year, month, day, hour, minute, second]= buffer.slice(-8, -2);
  this.timestamp = { year, month, day, hour, minute, second };
}

Frame.prototype.isValid = function() {
  const length = this.buffer.length;
  if (length < MIN_LENGTH) {
    return false;
  }
  const expectedLength = this.buffer.readUIntBE(2, 4);
  return length === expectedLength && this.buffer.slice(-2).toString() === '\r\n'
}

module.exports = Frame;
