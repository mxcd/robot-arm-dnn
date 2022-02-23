// import express
import express from 'express';
import { addDataListener, removeDataListener, startWebsocket } from './ws.js';
import {seed} from '../dnn/seed.js';
import cors from 'cors'
import WebSocket, { WebSocketServer } from 'ws';
import { start } from '../dnn/calculation.js';


startWebsocket()
seed();
start(100)