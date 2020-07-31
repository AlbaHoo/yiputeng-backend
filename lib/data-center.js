const lodash = require('lodash');

async function handleRequest(frame) {
  console.log(frame);
  if (frame.isValid()) {
    return buf;
  } else {
    return Buffer.from('invalid data');
  }
}

const DataCenter = {
  handleRequest
};

module.exports = DataCenter;
