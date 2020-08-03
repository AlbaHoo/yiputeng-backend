let http = require('http');
let bodyParser = require('body-parser');
let express = require('express');
let io = require('socket.io');
let pg = require('pg');
let request = require('request');
let uuidv4 = require('uuid/v4');

// These are Socket.IO Server parameters:
// SERVER_PING_TIMEOUT_MS specifies how long the client/server waits for the expected PONG/PING msg - before closing the connection.
// SERVER_PING_INTERVAL_MS specifies the interval between pings from the client.
const SERVER_PING_TIMEOUT_MS = 15000;
const SERVER_PING_INTERVAL_MS = 25000;

// Interval between updates to sync_service table in db.
const ALIVE_UPDATE_PERIOD_MS = 30000;    // 30 seconds.

// database connection cool
let dbConfig = {
  user: process.env.POSTGRESQL_USERNAME || null,
  password: process.env.POSTGRESQL_PASSWORD || null,
  database: process.env.POSTGRESQL_DATABASE || 'vivi_db_development',
  host: process.env.POSTGRESQL_ADDRESS || 'localhost',
  port: process.env.POSTGRESQL_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
};
let pool = new pg.Pool(dbConfig);
let sync_service_id = uuidv4();

// communicate with rails
let railsOrigin = process.env.RAILS_ORIGIN || 'http://localhost:3000';
let railsRequest = (method, path, params) => new Promise((resolve, reject) => {
  var options = {
    url: railsOrigin + '/api/v1/' + path,
    method: method,
    timeout: 15000
  };
  if (method === 'GET') {
    options.qs = params;
    // parse response as JSON
    options.json = true;
  } else {
    options.json = params;
  }
  request(options, (err, response, body) => {
    if (err || response.statusCode >= 400) {
      reject(err);
    } else {
      resolve(body);
    }
  });
});

// regular old http server
let port = process.env.PORT || 3003;
let server = http.createServer();
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});

// add express app to handle normal endpoints
let app = express();
server.on('request', app);

let jsonParser = bodyParser.json();

let restToken = process.env.REST_TOKEN || '';
let restAuthenticate = (req, res, next) => {
  if (req.headers['x-vivi-sync-token'] === restToken) {
    next();
  } else {
    res.sendStatus(401);
  }
};

app.get(['/ping', '/sync/ping'], (req, res) => res.sendStatus(200));

// add socket.io app to handle live communication
let live = io(server, {
  path: '/sync/live',
  pingTimeout: SERVER_PING_TIMEOUT_MS,
  pingInterval: SERVER_PING_INTERVAL_MS
});

// actual logic

let boxes = {};

let railsSync = (box, params) => railsRequest('PUT', `boxes/${box.id}`, Object.assign({}, params, { password: box.password, keep_dirty: true }));

let boxAuthenticate = (box_id, box_password) => pool.query('SELECT id, cloud_password, sync_dirty FROM boxes WHERE id = $1 LIMIT 1', [box_id]).then((result) => {
  if (result.rows[0] && result.rows[0].cloud_password === box_password) {
    return result.rows[0];
  } else {
    throw 'Authentication failed';
  }
});

// no need to catch pool.query errors here in these 2 fns.
// as generic catch around there usage.
let boxSync = (box, params) => railsSync(box, params).then((sync) => box.socket.emit('sync', sync, () => pool.query('UPDATE boxes SET sync_dirty = $1 WHERE id = $2', [false, box.id])));

let boxSyncConnectionStatus = (box_id, connected) => {
  pool.query('UPDATE boxes SET sync_connected = $1, sync_service_id = $2 WHERE id = $3', [connected, sync_service_id, box_id]);
};

live.on('connection', (socket) => {
  let { box_id, box_password } = socket.handshake.query;

  boxAuthenticate(box_id, box_password)
    .then((record) => {

      let old_socket;
      if (boxes[record.id]) {
        old_socket = boxes[record.id].socket;
      }

      // update record to new socket.
      let box = boxes[record.id] = {
        id: record.id,
        password: record.cloud_password,
        socket: socket
      };

      // Install event handlers as early as possible
      box.socket.on('disconnect', (reason) => {
        if (boxes[box.id] && (boxes[box.id].socket.id === box.socket.id)) {
          // disconnect of current socket.
          delete boxes[box.id];
          boxSyncConnectionStatus(box.id, false);
          console.log(`box_id: "${box.id}", connected: false, reason: "${reason}"`);
        } else {
          // disconnect of old socket.
          console.log(`disconnect from old box_id: "${box.id}", connected: false, reason: "${reason}"`);
        }
      });

      box.socket.on('error', (error) => {
        console.log(`socket error box_id: ${box.id} error: ${error}`);
      });

      box.socket.on('sync', (params) => boxSync(box, params));

      boxSyncConnectionStatus(box.id, true);
      console.log(`box_id: "${box_id}", connected: true`);

      // disconnect old socket, once new one has been setup.
      if (old_socket) {
        old_socket.disconnect(true);
      }

      if (record.sync_dirty) {
        boxSync(box);
      }
    })
    .catch((err) => {
      console.log(`caught error box_id: ${box_id} err: ${err}`);
      socket.disconnect(true);
    });
});

app.post('/sync/rest/sync', restAuthenticate, jsonParser, (req, res) => {
  if (req.body && Array.isArray(req.body.boxes)) {
    req.body.boxes
      .map((box_id) => boxes[box_id])
      .filter((box) => box)
      .forEach((box) => boxSync(box));
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

// record sync service into the database.
let syncServiceRegister = () => {
  pool.query("INSERT INTO sync_services (id, socket_count, created_at, updated_at) VALUES ($1, 0, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')", [sync_service_id])
    .then((result) => {
      console.log(`recorded sync service ID: ${sync_service_id}`);
    }).catch((err) => {
      console.log(`syncServiceRegister:Failed record ID: ${sync_service_id}  ... exiting`);
      process.exit();
    });
};

// periodic update to database.
let syncServiceAlive = () => {
  let count = Object.keys(boxes).length;
  pool.query("UPDATE sync_services SET updated_at = NOW() AT TIME ZONE 'UTC', socket_count = $1 WHERE id = $2", [count, sync_service_id])
    .then(data => {
      if (data.rowCount !== 1) {
         console.log('syncServiceAlive failed to update db table:', data);
      }
    })
    .catch((error) => {
      console.log('syncServiceAlive ERROR:', error);
    });
};

// record sync service into the database.
syncServiceRegister();

setInterval(() => {
  syncServiceAlive();
}, ALIVE_UPDATE_PERIOD_MS);

