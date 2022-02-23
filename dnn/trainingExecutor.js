import {seed} from './seed.js';
import {start} from './calculation.js';
import { fromJson } from './dnn.js';
import { robots, networks } from './data.js';
import {mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync} from 'fs';

// parse arguments
const args = process.argv.slice(2);

function calculateRating(robot) {
  const {currentPosition, targetPosition, dead} = robot;
  if(dead) return 0;
  const distance = Math.sqrt(Math.pow(currentPosition.x - targetPosition.x, 2) + Math.pow(currentPosition.y - targetPosition.y, 2));
  return 1/distance;
}

(async () => {
  const seedFile = args[0];
  const mutationRate = parseFloat(args[1]);
  const currentGeneration = parseInt(args[2]);
  const currentBatch = parseInt(args[3]);
  const iterationLimit = parseInt(args[4]);

  if(!existsSync(seedFile)) {
    return;
  }

  const seedData = JSON.parse(readFileSync(seedFile));
  const seedNetwork = fromJson(seedData.network);
  seedNetwork.mutate(mutationRate);

  seed();
  networks[0] = seedNetwork;
  await start(-1, iterationLimit);
  const robot = robots[0];
  const network = networks[0];
  const rating = calculateRating(robot);
  writeFileSync(`./generations/${currentGeneration}/${currentBatch}.json`, JSON.stringify({
    network: network.toJson(),
    rating: rating,
    robot: robot
  }));
})();