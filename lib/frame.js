// board type, frame type, timestamp, /r/n
const MIN_LENGTH = 10;
const frameTypes = {
  SIM_STATE: 0x20,
  STATE: 0x70
}

const mergeBuffer = (a1, a2) => {
  const c = new Uint8Array(a1.length + a2.length);
  c.set(a1);
  c.set(a2, a1.length);
  return c;
}

// Request frame
class Frame {
  constructor(buffer) {
    this.buffer = buffer;
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

  pong() {
    if (this.frameType === frameTypes.STATE) {
      const length = 16;
      const buf = Buffer.allocUnsafe(2);
      buf.writeUInt16BE(length);
      const [b1, b2] = buf;
      const { year, month, day, hour, minute, second } = this.timestamp;
      const bytes = [0x01, 0x70, b1, b2, 0x01, 0x01, 0x00, 0x00, year, month, day, hour, minute, second, 0x0D, 0x0A];
      return Buffer.from(bytes);
    }
    return null;
  }

  test() {
    if (this.frameType === frameTypes.STATE) {
      const length = 30;
      const buf = Buffer.allocUnsafe(2);
      buf.writeUInt16BE(length);
      const [b1, b2] = buf;
      const [year, month, day, hour, minute, second] = [20, 8, 4, 15, 15, 15];
      const headbytes = new Uint8Array([0x01, 0x71, b1, b2, 0x01, 0x04]);
      const valuebytes = mergeBuffer(new Uint8Array(14), [0x00, 0x02]);
      const tailbytes = new Uint8Array([year, month, day, hour, minute, second, 0x0D, 0x0A]);
      const bytes = mergeBuffer(mergeBuffer(headbytes, valuebytes), tailbytes);
      return Buffer.from(bytes);
    }
    return null;
  }

  async handleRequest() {
    throw 'Not implemented for this type of frame'
  }
}

module.exports = {
  Frame
};
