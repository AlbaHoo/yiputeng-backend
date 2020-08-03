// board type, frame type, timestamp, /r/n
const MIN_LENGTH = 10;
const frameTypes = {
  SIM_STATE: 0x20,
  STATE: 0x70
}

// Request frame
class Frame {
  constructor(buffer) {
    this.buffer = buffer;
    if (buffer.length < MIN_LENGTH) {
      return;
    }
    this.length = buffer.length;
    // first 4 bytes
    this.boardType = buffer[0];
    this.frameType = buffer[1];
    this.expectedLength = this.buffer.readUIntBE(2, 2); // (offset, bytelength)
    this.boardCode = this.buffer.slice(4, 19).toString();
    if (this.frameType === frameTypes.STATE) {
      this.softwareVersion = this.buffer.slice(19, 34).toString();
      this.laneCount = this.buffer.readUIntBE(34, 1) || 1;
      const N = this.laneCount;
      this.laneStatus = new Uint8Array(this.buffer.buffer.slice(35, 35 + N));
      this.laneStocks = new Uint8Array(this.buffer.buffer.slice(35 + N , 35 + 2 * N));
      this.prices = new Uint16Array(this.buffer.buffer.slice(35 + 2 * N, 35 + 4 * N));
      this.signal = this.buffer.readUIntBE(42 + 4 * N, 1);
      this.machineType = this.buffer.readUIntBE(43 + 4 * N, 1);
      this.specialFuncCode = this.buffer.readUIntBE(44 + 4 * N, 1);
    }

    const [year, month, day, hour, minute, second]= buffer.slice(-8, -2);
    this.timestamp = { year, month, day, hour, minute, second };
  }

  verify() {
    if (this.length < MIN_LENGTH) {
      return { error: 'too short'}
    } else if (!Object.values(frameTypes).includes(this.frameType)) {
      return { error: `${this.frameType} is not supported`};
    } else if ( this.length !== this.expectedLength) {
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
