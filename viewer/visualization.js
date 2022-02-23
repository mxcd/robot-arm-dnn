// this script is used to visualize the movement of the robot arm
// the first arm is fixed in the center of the canvas and can be rotated from +180 degrees to -180 degrees
// the second arm is fixed to the end of the first arm and can be rotated from +180 degrees to -180 degrees
// it will be possible to input the desired position of the probe at the end of the arm
// the coordinate system has it's origin in the center of the canvas

const canvas = document.getElementById('canvas');
const networkCanvas = document.getElementById('network-canvas');

const CANVAS_EDGE_LENGTH = 750;
const CANVAS_CENTER_X = CANVAS_EDGE_LENGTH / 2;
const CANVAS_CENTER_Y = CANVAS_EDGE_LENGTH / 2;

const NETWORK_CANVAS_WIDTH = 1250;
const NETWORK_CANVAS_HEIGHT = 750;

let robots = [];
let networks = {};

let networkMouseX = 0;
let networkMouseY = 0;

// convert coordinates to canvas pixels
function coordinatesToCanvasPoint(x, y) {
  return {
    x: CANVAS_CENTER_X + x,
    y: CANVAS_CENTER_Y - y
  };
}

// call localhost:30000/positions to get the current positions of the robot arms
function fetchPositions() {
  return new Promise((resolve, reject) => {
    fetch('http://localhost:30000/positions')
      .then(response => response.json())
      .then(json => {
        robots = json;
        resolve()
      }).catch(() => { reject() });
  });
}

function clearCanvas() {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, CANVAS_EDGE_LENGTH, CANVAS_EDGE_LENGTH);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, CANVAS_EDGE_LENGTH, CANVAS_EDGE_LENGTH);
}

function clearNetworkCanvas() {
  const ctx = networkCanvas.getContext('2d');
  ctx.clearRect(0, 0, NETWORK_CANVAS_WIDTH, NETWORK_CANVAS_HEIGHT);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, NETWORK_CANVAS_WIDTH, NETWORK_CANVAS_HEIGHT);
}

// draw the robot arms
// for every robot in the positions array, draw a new set of arms
// change the color of each arm, starting with black
function drawRobotArm(index, tick) {
  
  const robot = robots[index];
  if(!robot) return;
  
  const ctx = canvas.getContext('2d');
  const { alpha, beta, currentPosition, targetPosition, armLengthA, armLengthB, anchorX, anchorY } = robot;
  const { x: currentX, y: currentY } = currentPosition;
  const { x: targetX, y: targetY } = targetPosition;
  const { x: armAStartX, y: armAStartY } = {x: anchorX, y: anchorY};
  const { x: armAEndX, y: armAEndY } = {x: armAStartX + armLengthA * Math.cos(alpha * Math.PI / 180), y: armAStartY + armLengthA * Math.sin(alpha * Math.PI / 180)};
  const { x: armBStartX, y: armBStartY } = {x: armAEndX, y: armAEndY};
  const { x: armBEndX, y: armBEndY } = {x: armBStartX + armLengthB * Math.cos((alpha+beta) * Math.PI / 180), y: armBStartY + armLengthB * Math.sin((alpha+beta) * Math.PI / 180)};

  ctx.beginPath();
  const canvasArmAStartPoint = coordinatesToCanvasPoint(armAStartX, armAStartY);
  const canvasArmAEndPoint = coordinatesToCanvasPoint(armAEndX, armAEndY);
  const canvasArmBEndPoint = coordinatesToCanvasPoint(armBEndX, armBEndY);
  const canvasTargetPoint = coordinatesToCanvasPoint(targetX, targetY);

  ctx.moveTo(canvasArmAStartPoint.x, canvasArmAStartPoint.y);
  ctx.lineTo(canvasArmAEndPoint.x, canvasArmAEndPoint.y);
  ctx.lineTo(canvasArmBEndPoint.x, canvasArmBEndPoint.y);
  ctx.strokeStyle = 'red';
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(canvasArmAEndPoint.x, canvasArmAEndPoint.y, 10, 10, Math.PI / 4, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(canvasArmAStartPoint.x, canvasArmAStartPoint.y, 10, 10, Math.PI / 4, 0, 2 * Math.PI);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(canvasTargetPoint.x - 5, canvasTargetPoint.y - 5);
  ctx.lineTo(canvasTargetPoint.x + 5, canvasTargetPoint.y + 5);
  ctx.moveTo(canvasTargetPoint.x + 5, canvasTargetPoint.y - 5);
  ctx.lineTo(canvasTargetPoint.x - 5, canvasTargetPoint.y + 5);
  ctx.strokeStyle = 'blue';
  ctx.stroke();
}

function drawNetwork(index, tick) {
  console.log(`drawing network ${index}`);
  const network = networks[index];
  if(!network) return;

  clearNetworkCanvas();

  const ctx = networkCanvas.getContext('2d');
  const layerCount = network.layers.length;
  const layerWidth = NETWORK_CANVAS_WIDTH / (layerCount + 1);
  const maxNeuronCount = network.layers.reduce((max, layer) => Math.max(max, layer.neurons.length), 0);
  const neuronHeight = NETWORK_CANVAS_HEIGHT / (maxNeuronCount + 1);
  const neuronPositions = {}
  for(let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
    const neuronCount = network.layers[layerIndex].neurons.length;
    for(let neuronIndex = 0; neuronIndex < neuronCount; neuronIndex++) {
      const neuron = network.layers[layerIndex].neurons[neuronIndex];
      const neuronX = layerWidth/2 + layerWidth * layerIndex;
      const neuronY = neuronHeight/2 + (maxNeuronCount-neuronCount) * neuronHeight/2 + neuronHeight * neuronIndex;
      neuronPositions[neuron.id] = {x: neuronX, y: neuronY};
    }
  }

  for(const layer of network.layers) {
    for(const neuron of layer.neurons) {
      for(const axon of neuron.axons) {
        const axonStart = neuronPositions[axon.source];
        const axonEnd = neuronPositions[axon.destination];
        ctx.setLineDash([8, 2]);
        ctx.lineDashOffset = (((tick/2)%10) - 5) * -1;
        ctx.beginPath();
        ctx.moveTo(axonStart.x, axonStart.y);
        ctx.bezierCurveTo(axonStart.x+30,axonStart.y, axonEnd.x-30,axonEnd.y, axonEnd.x,axonEnd.y);
        // ctx.lineTo(axonEnd.x, axonEnd.y);
        if(axon.weight > 0) ctx.strokeStyle = 'blue'
        else ctx.strokeStyle = 'orange';
        ctx.lineWidth = Math.abs(axon.weight)*4;

        ctx.stroke();
      }
    }
  }

  let hoverNeuron = null;

  for(const layer of network.layers) {
    for(const neuron of layer.neurons) {
      const { x: neuronX, y: neuronY } = neuronPositions[neuron.id];
      ctx.setLineDash([]);
      ctx.lineWidth = 2
      ctx.beginPath();
      ctx.ellipse(neuronX, neuronY, neuronHeight/4, neuronHeight/4, Math.PI / 4, 0, 2 * Math.PI);

      // check if mouse is hovering over the ellipse
      if(networkMouseX > neuronX - neuronHeight/4 && networkMouseX < neuronX + neuronHeight/4 && networkMouseY > neuronY - neuronHeight/4 && networkMouseY < neuronY + neuronHeight/4) {
        ctx.fillStyle = 'lightgrey';
        hoverNeuron = neuron;
      }
      else {
        ctx.fillStyle = 'white';
      }

      ctx.strokeStyle = 'black';
      ctx.stroke();
      ctx.fill();
    }
  }

  for(const neuron of network.layers[0].neurons) {
    const value = neuron.value;
    const { x: neuronX, y: neuronY } = neuronPositions[neuron.id];
    ctx.font = `${Math.floor(neuronHeight/6)}px sans-serif`;
    ctx.fillStyle = 'black';
    ctx.fillText(`${neuron.name.replace('InputNode', '')}`, 10+neuronX-layerWidth/2, neuronY-neuronHeight/4);
    ctx.fillText(`${Math.round(neuron.value*100)/100}`, 10+neuronX-layerWidth/2, neuronY);
    ctx.fillText(`${Math.round(neuron.inputValue*10)/10}`, 10+neuronX-layerWidth/2, neuronY+neuronHeight/4);
  }

  for(const layer of network.layers) {
    for(const neuron of layer.neurons) {
      const { x: neuronX, y: neuronY } = neuronPositions[neuron.id];
      ctx.font = `${Math.floor(neuronHeight/6)}px sans-serif`;
      ctx.fillStyle = 'black';
      ctx.fillText(`${Math.round(neuron.value*100)/100}`, neuronX-neuronHeight/4+5, neuronY)
    }
  }

  for(const neuron of network.layers[network.layers.length-1].neurons) {
    const value = neuron.value;
    const { x: neuronX, y: neuronY } = neuronPositions[neuron.id];
    ctx.font = `${Math.floor(neuronHeight/6)}px sans-serif`;
    ctx.fillStyle = 'black';
    ctx.fillText(`${neuron.name.replace('InputNode', '')}`, neuronX+layerWidth/4, neuronY-neuronHeight/4);
    ctx.fillText(`${Math.round(neuron.value*100)/100}`, neuronX+layerWidth/4, neuronY);
  }

  if(hoverNeuron) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2
    ctx.rect(NETWORK_CANVAS_WIDTH - 310, NETWORK_CANVAS_HEIGHT-310, 300, 300);
    ctx.stroke()
    ctx.font = `12px sans-serif`;
    ctx.fillStyle = 'black';
    const textArray = JSON.stringify(hoverNeuron, null, 2).split('\n');
    for(let i = 0; i < textArray.length; i++) {
      ctx.fillText(textArray[i], NETWORK_CANVAS_WIDTH - 300, NETWORK_CANVAS_HEIGHT-290 + i*15);
    }
  }

  ctx.font = `10px sans-serif`;
  ctx.fillStyle = 'black';
  ctx.fillText(`x: ${networkMouseX} | y: ${networkMouseY}`, 10, NETWORK_CANVAS_HEIGHT-10);
}

// on document ready
document.addEventListener("DOMContentLoaded", function() {
  ws = new WebSocket("ws://localhost:30000");
  ws.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    robots = data.robots;
    networks = data.networks;
  });
  /* webSocket.on("positions", (positions) => {
    positions = JSON.parse(positions);
  }); */

  networkCanvas.onmousemove = function(e) {
    let r = networkCanvas.getBoundingClientRect();
    networkMouseX = e.clientX - r.left;
    networkMouseY = e.clientY - r.top;
  }

  document.getElementById('reseed').addEventListener('click', function() {
    //call rest api localhost:30000/seed
    fetch('http://localhost:30000/seed', (res) => {console.log(res)})
  });

  let currentRobot = 0;

  let tick = 0;
  setInterval(async () => {
    ++tick;
    if(tick >= 10000) tick = 0;
    clearCanvas();
    drawRobotArm(currentRobot, tick);
    drawNetwork(currentRobot, tick);
  }, 1000/60)
});