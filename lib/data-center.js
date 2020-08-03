const lodash = require('lodash');

async function handleRequest(frame) {
  console.log(frame);
  const verified = frame.verify();
  if (verified.ok) {
    return frame.pong();
  } else {
    return Buffer.from(verified.error);
  }
}

const DataCenter = {
  handleRequest
};

module.exports = DataCenter;
