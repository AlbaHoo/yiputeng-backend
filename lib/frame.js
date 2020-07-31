// board type, frame type, timestamp, /r/n
const MIN_LENGTH = 10;
const frameTypes = {
  SIM_STATE: 0x20,
  STATE: 0x70,
  REPLY: 0x71
}

class Frame {
  constructor(buffer) {
    this.buffer = buffer;
    if (buffer.length < MIN_LENGTH) {
      return;
    }
    this.length = buffer.length;
    this.boardType = buffer[0];
    this.frameType = buffer[1];
    const [year, month, day, hour, minute, second]= buffer.slice(-8, -2);
    this.timestamp = { year, month, day, hour, minute, second };
  }

  verify() {
    const expectedLength = this.buffer.readUIntBE(2, 2); // (offset, bytelength)
    if (this.length < MIN_LENGTH) {
      return { error: 'too short'}
    } else if (!Object.values(frameTypes).includes(this.frameType)) {
      return { error: `${this.frameType} is not supported`};
    } else if ( this.length !== expectedLength) {
      return { error: `content length mismatch, expected: ${expectedLength}, actual: ${this.length}`}
    } else {
      return { ok: true };
    }
  }

  async handleRequest() {
    throw 'Not implemented for this type of frame'
  }
}

module.exports = {
  Frame
};
