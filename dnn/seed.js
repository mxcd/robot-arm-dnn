import { robots, networks } from "./data.js";
import {readFileSync} from 'fs';
import { InputNeuron, Neuron, NeuralNetwork, NeuronLayer, fromJson } from "./dnn.js";

const SANDBOX_EDGE_LENGTH = 750
const HALF_SANDBOX_EDGE_LENGTH = SANDBOX_EDGE_LENGTH / 2;

export function seed(robotCount = 1, seedFile) {
  robots.length = 0;
  networks.length = 0;
  for(let i = 0; i < robotCount; i++) {
    robots.push({
      id: i,
      dead: false,
      alpha: Math.random()*360 - 180,
      beta: Math.random() >= 0.5 ? -90 - Math.random()*90 : 90 + Math.random()*90,
      currentPosition: {
        x: 0,
        y: 0
      },
      targetPosition: {
        x: Math.random()*SANDBOX_EDGE_LENGTH - HALF_SANDBOX_EDGE_LENGTH,
        y: Math.random()*SANDBOX_EDGE_LENGTH - HALF_SANDBOX_EDGE_LENGTH
      },
      armLengthA: 270,
      armLengthB: 270,
      anchorX: 0,
      anchorY: 0
    });
    if(!seedFile) {
      networks.push(seedDNN()) 
    }
    else {
      networks.push(loadDNN(seedFile)) 
    }
  }
}

function loadDNN(file) {
  return fromJson(JSON.parse(readFileSync(file, 'utf8')).network);
}

function seedDNN() {
  const alphaInputNode = new InputNeuron(null, 'angleActivationFunction', "alphaInputNode");
  const betaInputNode = new InputNeuron(null, 'angleActivationFunction', "betaInputNode");
  // const armALengthInputNode = new InputNeuron(null, armLengthActivationFunction, "armLengthAInputNode");
  // const armBLengthInputNode = new InputNeuron(null, armLengthActivationFunction, "armLengthBInputNode");
  // const anchorXInputNode = new InputNeuron(null, coordinateActivationFunction, "anchorXInputNode");
  // const anchorYInputNode = new InputNeuron(null, coordinateActivationFunction, "anchorYInputNode");
  const targetXInputNode = new InputNeuron(null, 'coordinateActivationFunction', "targetXInputNode");
  const targetYInputNode = new InputNeuron(null, 'coordinateActivationFunction', "targetYInputNode");
  const currentXInputNode = new InputNeuron(null, 'coordinateActivationFunction', "currentXInputNode");
  const currentYInputNode = new InputNeuron(null, 'coordinateActivationFunction', "currentYInputNode");

  const inputLayer = new NeuronLayer()
  inputLayer.addNeuron(alphaInputNode);
  inputLayer.addNeuron(betaInputNode);
  // inputLayer.addNeuron(armALengthInputNode);
  // inputLayer.addNeuron(armBLengthInputNode);
  // inputLayer.addNeuron(anchorXInputNode);
  // inputLayer.addNeuron(anchorYInputNode);
  inputLayer.addNeuron(targetXInputNode);
  inputLayer.addNeuron(targetYInputNode);
  inputLayer.addNeuron(currentXInputNode);
  inputLayer.addNeuron(currentYInputNode);

  const hiddenLayerCount = 4;
  let layers = [inputLayer];
  for(let i = 0; i < hiddenLayerCount; i++) {
    layers.push(new NeuronLayer(6, 'sigmoidActivationFunction'));
  }
  layers.push(new NeuronLayer(4, 'sigmoidActivationFunction'));

  const alphaOutputNode = new Neuron(null, 'sigmoidActivationFunction', "alphaOutputNode");
  const betaOutputNode = new Neuron(null, 'sigmoidActivationFunction', "betaOutputNode");

  const outputLayer = new NeuronLayer()
  outputLayer.addNeuron(alphaOutputNode);
  outputLayer.addNeuron(betaOutputNode);

  layers.push(outputLayer);

  const neuralNetwork = new NeuralNetwork();
  neuralNetwork.setLayers(layers);
  neuralNetwork.initAxons();
  return neuralNetwork;
}