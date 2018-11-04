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
  }
};
module.exports = DataCenter;
