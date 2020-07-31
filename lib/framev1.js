// board type, frame type, timestamp, /r/n
const MIN_LENGTH = 10;
const frameTypes = {
  SIM_STATE: 0x20,
  STATE: 0x70
}

function Frame(buffer) {
  this.buffer = buffer;
  this.length = buffer.length;
  this.boardType = buffer[0];
  this.frameType = buffer[1];
  const [year, month, day, hour, minute, second]= buffer.slice(-8, -2);
  this.timestamp = { year, month, day, hour, minute, second };
}

Frame.prototype.isValid = function () {
  if (this.length < MIN_LENGTH || !Object.values(frameTypes).contains(this.frameType)) {
    return false;
  }
  const expectedLength = this.buffer.readUIntBE(2, 4);
  return this.length === expectedLength && this.buffer.slice(-2).toString() === '\r\n'
}

module.exports = Frame;
