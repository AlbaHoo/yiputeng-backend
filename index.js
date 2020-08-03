const net = require('net');
const Logger = require('./lib/logger.js');
const { Frame } = require('./lib/frame');
const FrameManager = require('./lib/data-center');
const log = new Logger('index');

const fakeData = '0170006038363936323730333930383733303941444838313156332e302e303400000a010101010101010101010a0a0a0a0a0a0a0a0a0a0001000100010001000100010001000100010001000000000100000c01040000000000000018390d0a';
function BoxServer(port) {
  this.port = port;
  this.server = net.createServer(this.socketResponder);
  log.info('start tcp server', { port });
  this.server.listen(this.port, '0.0.0.0');
}

BoxServer.prototype.socketResponder = function(socket) {
  const remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
  log.info('New client connected', remoteAddress);

  const processData = async (data) => {
    log.info('Received data meta', { remoteAddress, length: data.length });
    log.info('Received data', data.toString('hex'));

    if (!(data instanceof Buffer)) {
      log.error('Invalid data', { data });
      return;
    }
    // separet packet via /\r\n/ and reject empty string
    const messages = data.toString().split(/\r\n/).filter(el => el);
    // forEach is not promise aware
    for (let i = 0; i < messages.length; i++) {
      let frame = new Frame(Buffer.from(messages[i] + '\r\n'));
      let response = await FrameManager.handleRequest(frame);
      socket.write(Buffer.from(response));
    }
  };

  const processDataTest = async (data) => {
    let frame = new Frame(Buffer.from(fakeData, 'hex'));
    let response = await FrameManager.handleRequest(frame);
    socket.write(Buffer.from(response));
  };

  socket.on('data', processDataTest);

	socket.on('end', function() {
    log.info('end');
    socket.end();
	});

  // Emitted when the server closes. If connections exist, this event is not emitted until all connections are ended.
	socket.on('close', function() {
    log.info('close');
    // socket.end();
	});

  socket.on('error', function(err) {
    log.error('error', err);
  });
};

new BoxServer(1234);
