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

test('calculates a+b', () => {
  let tree = createExpressionTree('a+b');
  expect(executeExpressionTree(tree, { a: 2, b: 6 })).toBe(8);
  expect(executeExpressionTree(tree, { a: 5, b: 2 })).toBe(7);
});

test('calculates a+b/a', () => {
  let tree = createExpressionTree('a+b/a');
  expect(executeExpressionTree(tree, { a: 2, b: 6 })).toBe(5);
});

test('calculates a * b / c * d', () => {
  let tree = createExpressionTree('a * b / c * d');
  expect(
    executeExpressionTree(tree, {
      a: 5,
      b: 8,
      c: 2,
      d: 4,
    })
  ).toBe(80);
});

test('calculates a+5*b*a', () => {
  let tree = createExpressionTree('a+5*b*a');
  expect(executeExpressionTree(tree, { a: 2, b: 3 })).toBe(32);
});
test('calculates a+(5*b*a)', () => {
  let tree = createExpressionTree('a+(5*b*a)');
  expect(executeExpressionTree(tree, { a: 2, b: 3 })).toBe(32);
});

test('calculates a+5*(b*a)', () => {
  let tree = createExpressionTree('a+5*(b*a)');
  expect(executeExpressionTree(tree, { a: 2, b: 3 })).toBe(32);
});
