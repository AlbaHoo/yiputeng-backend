const lodash = require('lodash');
const BOARD_TYPE_BYTE = 0
const FRAME_LENGTH1 = 2
const FRAME_LENGTH2 = 3

const FRAME_END = [0x0D, 0x0A]


function code2num(code) {
  return parseInt(code, 10);
}
function code2letter(code) {
  return String.fromCharCode(code);
}

function validFrame(bufferArr) {
  if (bufferArr.length < 12)
    return false;
  else {
    const length = code2num(bufferArr[FRAME_LENGTH1]) * 256 + code2num(bufferArr[FRAME_LENGTH2]);
    return lodash.isEqual([bufferArr[length - 2], bufferArr[length - 1]], FRAME_END);
  }
}

const DataCenter = {
  buffer2arr: (buffer) => buffer.toJSON().data,

  hex16To10: (hexs) => {
    return hexs.map((e) => parseInt(e, 16));
  },

  hex10To16: (hex10) => {
    return hex10s.map((e) => parseInt(e, 10).toString('hex'));
  },

  ascii2char: (data) => {
    return data.map((code) => String.fromCharCode(code));
  },

  decodeBuffer: (buffer) => {
    const data = buffer.toJSON().data;
    const components = {};
    if (validFrame(data)) {
      return 'valid';
    } else {
      return 'invalid';
    }
  }
};
module.exports = DataCenter;
