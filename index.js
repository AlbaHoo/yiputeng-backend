const net = require('net');
const Logger = require('./logger');
const log = new Logger('index');
const DataCenter = require('./data-center');

function BoxServer(port) {
  this.port = port;
  this.server = net.createServer(this.app);
  log.info('start tcp server', { port: port });
  this.server.listen(this.port, '127.0.0.1');
}

BoxServer.prototype.app = function(conn) {
  log.info('connected');
	conn.on('end', function() {
    log.info('disconnected');
    conn.end();
	});
	conn.on('data', function(data) {
    log.info('GOT DATA from client', { data: data });
    conn.write(data);
	});
  conn.on('error', log.error);
};

new BoxServer(1234);
