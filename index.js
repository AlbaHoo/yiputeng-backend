var net = require('net');
const Logger = require('./lib//logger.js');
const { Frame } = require('../lib/frame');
const FrameManager = require('./lib/data-center');

const log = new Logger('index');

function BoxServer(port) {
  this.port = port;
  this.server = net.createServer(this.app);
  log.info('start tcp server', { port });
  this.server.listen(this.port, '0.0.0.0');
}

BoxServer.prototype.app = function(socket) {
  const remoteAddress = socket.remoteAddress + ':' + socket.remotePort;
  log.info('New client connected:', remoteAddress);

  socket.on('data', async data => {
    log.info('Received data meta:', { remoteAddress, length: data.length });
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
  });

	socket.on('end', function() {
    log.info('end');
    socket.end();
	});

  // all connections are ended
	socket.on('close', function() {
    log.info('close');
    // socket.end();
	});

  socket.on('error', function(err) {
    log.error('error', err);
  });
};

new BoxServer(1234);
