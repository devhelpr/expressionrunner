import {
  createExpressionTree,
  ExpressionNode,
} from './components/expression-parser';

import {
  clearExpressionFunctions,
  executeExpressionTree,
  extractValueParametersFromExpressionTree,
  isExpressionFunction,
  registerExpressionFunction,
} from './components/expression-tree-execute';

import {
  convertGridToNamedVariables,
  isRangeValue,
  getRangeFromValues,
  getRangeValueParameters,
} from './utils/grid-values';

function runExpression(expression: string, values?: any) {
  const tree = createExpressionTree(expression);
  return executeExpressionTree(tree, values || {});
}

export {
  clearExpressionFunctions,
  convertGridToNamedVariables,
  createExpressionTree,
  executeExpressionTree,
  extractValueParametersFromExpressionTree,
  isExpressionFunction,
  isRangeValue,
  getRangeFromValues,
  getRangeValueParameters,
  registerExpressionFunction,
  runExpression,
  ExpressionNode,
};
