const lodash = require('lodash');

async function handleRequest(frame) {
  console.log(frame);
  const verified = frame.verify();
  if (verified.ok) {
    return JSON.stringify(frame);
  } else {
    return Buffer.from(verified.error);
  }
}

const DataCenter = {
  handleRequest
};

module.exports = DataCenter;
