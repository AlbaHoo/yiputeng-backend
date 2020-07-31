# Test
example/server: tcp message send from server
example/client: tcp message send from client

## Start server
node index.js

## Test send data from client

`echo -ne "$(cat example/clients/received-config)" | netcat localhost 1234`

read data from a file and send to localhost:1234

## Test with random message

`head -c 30 /dev/urandom | netcat localhost 1234` send randon 30 byte to server

Buffer.from('ff01', 'hex');
Buffer.from([255, 1]).toString('hex');
