import { createExpressionTree } from '../src/components/expression-parser';
import {
  executeExpressionTree,
  registerExpressionFunction,
} from '../src/components/expression-tree-execute';

registerExpressionFunction('Math.PI', () => {
  return Math.PI;
});

registerExpressionFunction('Math.floor', (a: number) => {
  return Math.floor(a);
});

test('adds 2 and 3', () => {
  let tree = createExpressionTree('2+3');
  expect(executeExpressionTree(tree, {})).toBe(5);
});

test('calculates 2 * (2+3)', () => {
  let tree = createExpressionTree('2 * (2+3)');
  expect(executeExpressionTree(tree, {})).toBe(10);
});

test('calculates 2^3', () => {
  let tree = createExpressionTree('2^3');
  expect(executeExpressionTree(tree, {})).toBe(8);
});

test('calculates 5 + 3 * 2 + 4', () => {
  let tree = createExpressionTree('5 + 3 * 2 + 4');
  expect(executeExpressionTree(tree, {})).toBe(15);
});

test('calculates 5 * 8 / 2 * 4', () => {
  let tree = createExpressionTree('5 * 8 / 2 * 4');
  expect(executeExpressionTree(tree, {})).toBe(80);
});

test('calculates Math.floor(Math.PI())', () => {
  let tree = createExpressionTree('Math.floor(Math.PI())');
  expect(executeExpressionTree(tree, {})).toBe(3);
});

test('calculates unknown() without function being available', () => {
  let tree = createExpressionTree('unknown()');
  expect(executeExpressionTree(tree, {})).toBe(0);
});
