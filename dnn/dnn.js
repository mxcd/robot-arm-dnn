import { nanoid } from 'nanoid'
import { activationFunctions } from './activationFunctions.js';
import { strict as assert } from 'assert';

export class InputNeuron {
  constructor(id, activationFunction, name) {
    this.id = id || nanoid();
    this.value = 0;
    this.activationFunction = activationFunction;
    this.name = name;
    this.axons = [];
  }
  set(value) {
    this.value = value;
  }
  get() {
    return activationFunctions[this.activationFunction](this.value);
  }
  mutate(mutationRate) {
    this.axons.forEach(a => a.mutate(mutationRate));
  }
  propagate() {
    this.axons.forEach(a => a.propagate());
  }
  toJson() {
    return {
      id: this.id,
      type: 'inputNeuron',
      inputValue: this.value,
      value: this.get(),
      name: this.name,
      activationFunction: this.activationFunction, 
      axons: this.axons.map(a => a.toJson())
    }
  }
}

export class Axon {
  constructor(id, initialWeight, source, destination) {
    this.id = id || nanoid();
    this.weight = initialWeight;
    this.source = source;
    this.destination = destination;
  }

  mutate(mutationRate) {
    this.weight += (Math.random()*2-1) * mutationRate;
  }

  propagate() {
    this.destination.set(this.source.id, this.source.get() * this.weight);
  }
  toJson() {
    return {
      id: this.id,
      weight: this.weight,
      source: this.source.id,
      destination: this.destination.id
    }
  }
}

export class Neuron {
  constructor(id, activationFunction, name) {
    this.id = id || nanoid();
    this.values = {};
    this.activationFunction = activationFunction;
    this.name = name;
    this.axons = []
    this.sum = 0
  }
  set(id, value) {
    this.values[id] = value;
  }
  get() {
    let sum = 0;
    for(const id in this.values) sum += this.values[id];
    this.sum = sum
    return activationFunctions[this.activationFunction](sum);
  }
  propagate() {
    this.axons.forEach(a => a.propagate());
  }
  mutate(mutationRate) {
    this.axons.forEach(a => a.mutate(mutationRate));
  }
  toJson() {
    return {
      id: this.id,
      type: 'neuron',
      value: this.get(),
      sum: this.sum,
      values: this.values,
      name: this.name,
      activationFunction: this.activationFunction,
      axons: this.axons.map(a => a.toJson())
    }
  }
}


export class NeuronLayer {
  constructor(neuronCount, activationFunction) {
    this.neurons = [];
    if(typeof (neuronCount) === "number" && typeof (activationFunction) === "string") {
      for(let i = 0; i < neuronCount; i++) {
        this.neurons.push(new Neuron(null, activationFunction));
      }
    }
  }
  propagate() {
    this.neurons.forEach(n => n.propagate());
  }
  mutate(mutationRate) {
    this.neurons.forEach(n => n.mutate(mutationRate));
  }
  addNeuron(neuron) {
    this.neurons.push(neuron);
  }
  toJson() {
    return {neurons: this.neurons.map(n => n.toJson())};
  }
}

export class NeuralNetwork {
  constructor() {
    this.layers = [];
    this.namedNeurons = {};
  }
  addLayer(layer) {
    this.layers.push(layer);
    for(const n of layer.neurons) {
      if(n.name) this.namedNeurons[n.name] = n;
    }
  }

  setLayers(layers) {
    this.layers = layers;
    for(const layer of this.layers) {
      for(const n of layer.neurons) {
        if(n.name) this.namedNeurons[n.name] = n;
      }
    }
  }

  getNeuron(name) {
    return this.namedNeurons[name];
  }

  propagate() {
    for(const layer of this.layers) {
      layer.propagate();
    }
  }

  mutate(mutationRate) {
    for(const layer of this.layers) {
      layer.mutate(mutationRate);
    }
  }
  initAxons() {
    for(let layerIndex = 0; layerIndex < this.layers.length-1; layerIndex++) {
      const sourceLayer = this.layers[layerIndex];
      const destinationLayer = this.layers[layerIndex+1];
      for(const sourceNeuron of sourceLayer.neurons) {
        for(const destinationNeuron of destinationLayer.neurons) {
          sourceNeuron.axons.push(new Axon(null, (Math.random()*2)-1, sourceNeuron, destinationNeuron));
        }
      }
    }
  }
  getNeuronById(id) {
    for(const layer of this.layers) {
      for(const neuron of layer.neurons) {
        if(neuron.id === id) return neuron;
      }
    }
  }

  toJson() {
    const json = {};
    json.layers = [];
    json.namedNeurons = {};
    for(const neuronName in this.namedNeurons) {
      json.namedNeurons[neuronName] = this.namedNeurons[neuronName].toJson();
    }
    for(const layer of this.layers) {
      json.layers.push(layer.toJson());
    }
    return json;
  }
}

export function fromJson(json) {
  const nn = new NeuralNetwork();
  for(const jsonLayer of json.layers) {
    const nnLayer = new NeuronLayer();
    for(const jsonNeuron of jsonLayer.neurons) {
      if(jsonNeuron.type === 'inputNeuron') {
        const neuron = new InputNeuron(jsonNeuron.id, jsonNeuron.activationFunction, jsonNeuron.name);
        nnLayer.addNeuron(neuron);
      }
      else {
        const neuron = new Neuron(jsonNeuron.id, jsonNeuron.activationFunction, jsonNeuron.name);
        nnLayer.addNeuron(neuron);
      }
    }
    nn.addLayer(nnLayer);
  }
  for(const jsonLayer of json.layers) {
    for(const jsonNeuron of jsonLayer.neurons) {
      const neuron = nn.getNeuronById(jsonNeuron.id);
      for(const jsonAxon of jsonNeuron.axons) {
        const axon = new Axon(jsonAxon.id, jsonAxon.weight, nn.getNeuronById(jsonAxon.source), nn.getNeuronById(jsonAxon.destination));
        neuron.axons.push(axon);
      }
    }
  }
  return nn;
}