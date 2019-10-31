const lodash = require('lodash');
const Frame = require('./frame');

async function handleRequest(bufferString) {
  const buf = Buffer.from(bufferString)
  const frame = new Frame(buf);
  console.log(frame);
  if (frame.isValid()) {
    return await buf;
  } else {
    return await Buffer.from('invalid data');
  }
}

const DataCenter = {
  handleRequest
};
module.exports = DataCenter;
