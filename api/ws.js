import { networks, robots, stats } from "../dnn/data.js";
import express from 'express';
import {seed} from '../dnn/seed.js';
import cors from 'cors'
import { WebSocketServer } from 'ws';

const dataListeners = [];

export function addDataListener(l) {
  dataListeners.push(l);
}

export function removeDataListener(l) {
  dataListeners.splice(dataListeners.indexOf(l), 1);
}

function updateListeners() {
  const data = JSON.stringify({stats: stats.data, robots, networks: networks.map(n => n.toJson())});
  dataListeners.forEach(l => l.send(data));
}

setInterval(updateListeners, 10);

export function startWebsocket() {
  const app = express();
  app.use(cors());

  app.get('/seed', (req, res) => {
    console.log('HTTP REST seed');
    seed();
    res.status(200).send('Seeded');
  });

  function heartbeat() {
    this.isAlive = true;
  }
  
  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', ws => {
    console.log(`new client connected`)
    addDataListener(ws);
    ws.on('pong', heartbeat);
  });
  
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) {
        removeDataListener(ws);
        console.log(`client disconnected`)
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 1000);
  
  wss.on('close', function close() {
    clearInterval(interval);
  });
  
  const server = app.listen(30000, () => { console.log(`listening on port 3000`)});
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
      wss.emit('connection', socket, request);
    });
  });
}