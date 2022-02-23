const SANDBOX_EDGE_LENGTH = 750
const HALF_SANDBOX_EDGE_LENGTH = SANDBOX_EDGE_LENGTH / 2;

const angleActivationFunction = x => {
  return Math.min(180, Math.max(-180, x)) / 180
}

const coordinateActivationFunction = x => {
  return Math.min(HALF_SANDBOX_EDGE_LENGTH, Math.max(-HALF_SANDBOX_EDGE_LENGTH, x)) / HALF_SANDBOX_EDGE_LENGTH
}

const sigmoidActivationFunction = x => Math.tanh(x);
const rectifierActivationFunction = x => Math.max(0, x);

export const activationFunctions = {
  'angleActivationFunction': angleActivationFunction,
  'coordinateActivationFunction': coordinateActivationFunction,
  'sigmoidActivationFunction': sigmoidActivationFunction,
  'rectifierActivationFunction': rectifierActivationFunction
}