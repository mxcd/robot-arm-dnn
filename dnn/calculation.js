import {robots, networks} from './data.js';
import { running } from './data.js';


export async function start(frequency, limit) {
  return new Promise((resolve) => {
    let counter = 0;
    if(frequency === -1) {
      while(running && (limit && ++counter <= limit)) {
        main();
      }
      resolve();
    }
    else {
      let interval = setInterval(() => {
        if(running && (limit && ++counter <= limit)) {
          main();
        }
        else {
          clearInterval(interval);
          resolve();
        }
      }, 1000/frequency);
    }
  })
}

function main() {
  for(let i = 0; i < robots.length; i++) {
    updateCalculatedValues(robots[i]);

    networks[i].getNeuron('alphaInputNode').set(robots[i].alpha);
    networks[i].getNeuron('betaInputNode').set(robots[i].beta);
    // networks[i].getNeuron('armLengthAInputNode').set(robots[i].armLengthA);
    // networks[i].getNeuron('armLengthBInputNode').set(robots[i].armLengthB);
    // networks[i].getNeuron('anchorXInputNode').set(robots[i].anchorX);
    // networks[i].getNeuron('anchorYInputNode').set(robots[i].anchorY);
    networks[i].getNeuron('targetXInputNode').set(robots[i].targetPosition.x);
    networks[i].getNeuron('targetYInputNode').set(robots[i].targetPosition.y);
    networks[i].getNeuron('currentXInputNode').set(robots[i].currentPosition.x);
    networks[i].getNeuron('currentYInputNode').set(robots[i].currentPosition.y);

    networks[i].propagate();

    robots[i].alpha += networks[i].getNeuron('alphaOutputNode').get();
    robots[i].beta += networks[i].getNeuron('betaOutputNode').get();

    if(robots[i].alpha >= 180) robots[i].alpha = 180;
    if(robots[i].alpha <= -180) robots[i].alpha = -180;
    if(robots[i].beta >= 180) robots[i].beta = 180;
    if(robots[i].beta <= -180) robots[i].beta = -180;
  }
}

const SANDBOX_EDGE_LENGTH = 750

function updateCalculatedValues(robot) {
  const armAEndX = robot.anchorX + robot.armLengthA * Math.cos(robot.alpha * Math.PI / 180);
  const armAEndY = robot.anchorY + robot.armLengthA * Math.sin(robot.alpha * Math.PI / 180);
  if(armAEndX > SANDBOX_EDGE_LENGTH/2 || armAEndX < -SANDBOX_EDGE_LENGTH/2 || armAEndY > SANDBOX_EDGE_LENGTH/2 || armAEndY < -SANDBOX_EDGE_LENGTH/2) {
    robot.dead = true;
  }
  const armBEndX = armAEndX + robot.armLengthB * Math.cos((robot.alpha + robot.beta) * Math.PI / 180);
  const armBEnxY = armAEndY + robot.armLengthB * Math.sin((robot.alpha + robot.beta) * Math.PI / 180);
  if(armBEndX > SANDBOX_EDGE_LENGTH/2 || armBEndX < -SANDBOX_EDGE_LENGTH/2 || armBEnxY > SANDBOX_EDGE_LENGTH/2 || armBEnxY < -SANDBOX_EDGE_LENGTH/2) {
    robot.dead = true;
  }
  robot.currentPosition.x = armBEndX
  robot.currentPosition.y = armBEnxY
}