import {mkdirSync, readdirSync, existsSync, readFileSync, writeFileSync, readFile, read, rmSync, stat} from 'fs';
import { nanoid } from 'nanoid';
import {seed} from './seed.js';
import {start} from './calculation.js';
import { robots, networks, stats } from './data.js';
import { spawn, exec } from 'child_process';
import { startWebsocket } from '../api/ws.js';
import { fromJson } from './dnn.js';

const BATCH_SIZE = 100;
const SURVIVAL_RATE = 0.1;
const MUTATION_RATE = 0.01;
const ITERATION_LIMIT = 300;
const GENERATION_LIMIT = 500;

const getDirectories = source =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

if(!existsSync('./generations')) {
  mkdirSync('./generations');
}

startWebsocket();

const generations = getDirectories('./generations').map(d => parseInt(d));
const latestGeneration = generations.length === 0 ? 0 : Math.max(...generations);

let currentGeneration = latestGeneration;

const DIR = process.cwd()

async function loadPopulation(generation) {
  const population = readdirSync(`./generations/${generation}/`, { withFileTypes: true })
    .filter(f => f.isFile())
    .map(f => f.name)
  let data = {}
  for(const file of population) {
    readFile(`./generations/${generation}/${file}`, 'utf-8', (err, d) => {
      if(err) throw err;
      data[`./generations/${generation}/${file}`] = JSON.parse(d);
    });
  }
  while(population.length != Object.keys(data).length) {
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  return data;
}

async function collectStats(data) {
  let fittestFile = null;
  let fittest = null
  let deadCount = 0;
  let minRating = Infinity;
  let maxRating = -Infinity;
  for(const file of Object.keys(data)) {
    const json = data[file];
    if(json.robot.dead) deadCount++;
    if(maxRating < json.rating) {
      fittest = json;
      fittestFile = file;
      maxRating = json.rating;
    }
    if(json.rating < minRating) {
      minRating = json.rating;
    }
  }
  return {
    fittestFile,
    deadCount,
    minRating,
    maxRating
  };
}

// delete all files that start with a number
async function deleteOldFiles(generation) {
  const files = readdirSync(`./generations/${generation}`, { withFileTypes: true })
    .filter(f => f.isFile())
    .map(f => f.name)
  for(const file of files) {
    if(!isNaN(parseInt(file.split('.')[0]))) {
      rmSync(`./generations/${generation}/${file}`);
    }
  }
}

(async () => {
  if(currentGeneration === 0) {
    if(!existsSync('./generations/0')) mkdirSync(`./generations/0`);
    seed();
    writeFileSync(`./generations/0/seed.json`, JSON.stringify({
      network: networks[0].toJson(),
      rating: 0,
      robot: robots[0]
    }));
    if(existsSync('stats.json')) rmSync('stats.json');
  }
  let seedFile = ''

  while(true) {
    if(!existsSync(`./generations/${currentGeneration}/fittest.json`)) {
      const data = await loadPopulation(currentGeneration);
      const s = {...(await collectStats(data)), generation: currentGeneration};
      stats.data = s;
      networks[0] = fromJson(data[s.fittestFile].network)
      console.log(`Generation ${currentGeneration} | MinRating: ${s.minRating} | MaxRating: ${s.maxRating} | Dead: ${s.deadCount} | Fittest: ${s.fittestFile}`);
      let statsLog = []
      if(existsSync('stats.json')) statsLog = JSON.parse(readFileSync('stats.json', 'utf-8'));
      statsLog.push(s);
      writeFileSync('stats.json', JSON.stringify(statsLog));
      writeFileSync(`./generations/${currentGeneration}/fittest.json`, JSON.stringify(data[s.fittestFile]));
    }
    
    deleteOldFiles(currentGeneration)

    seedFile = `./generations/${currentGeneration}/fittest.json`;

    ++currentGeneration;
    mkdirSync(`./generations/${currentGeneration}`);

    const parallelCount = 20;
    for(let i = 0; i < BATCH_SIZE;) {
      let finnishedCount = 0;
      for(let j = 0; j < parallelCount; ++j) {
        try {
          var child = exec(`node ${DIR}/dnn/trainingExecutor.js ${seedFile} ${MUTATION_RATE} ${currentGeneration} ${i+j} ${ITERATION_LIMIT}`, {cwd: DIR});
          child.on('exit', function() {
            ++finnishedCount;
          })
          child.on('error', e => console.log(e))
        }
        catch(e) {
          console.log(e)
        }
      }
      while(finnishedCount != parallelCount) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      i += parallelCount;
    }
  }
})()
