const lodash = require('lodash');

async function handleRequest(frame) {
  console.log(frame);
  const verified = frame.verify();
  if (verified.ok) {
    console.log( frame.test());
    return frame.test();
  } else {
    return Buffer.from(verified.error);
  }
}

const DataCenter = {
  handleRequest
};

module.exports = DataCenter;
