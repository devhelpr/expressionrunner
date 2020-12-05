import { createExpressionTree } from '../src/components/expression-parser';

import {
  executeExpressionTree,
  registerExpressionFunction,
} from '../src/components/expression-tree-execute';

import {
  isRangeValue,
  getRangeFromValues,
  getRangeValueParameters,
  runExpression,
} from '../src/index';

const logTree = (tree: any, treeIndex: number) => {
  console.log(treeIndex, tree);
  if (tree.nodes && tree.nodes.length > 0) {
    tree.nodes.map((node: any) => {
      if (node.nodes.length > 0) {
        logTree(node, treeIndex + 1);
      }
      return null;
    });
  }
};

const convertGridToNamedVariables = (values: any[]) => {
  let variables: any = {};
  values.map((rowValues: any, rowIndex: number) => {
    if (rowValues) {
      rowValues.map((cellValue: any, columnIndex: number) => {
        if (cellValue) {
          if (cellValue === '' || (cellValue !== '' && cellValue[0] !== '=')) {
            let letter = String.fromCharCode((columnIndex % 26) + 65);
            let value = Number(cellValue);
            if (isNaN(value)) {
              value = cellValue;
            }
            variables[letter + (rowIndex + 1)] = value;
          }
        }
        return null;
      });
    }
    return null;
  });
  return variables;
};

registerExpressionFunction('sum', (a: number, ...args: number[]) => {
  console.log('sum function', a, args[0]);
  if (isRangeValue(a.toString())) {
    console.log('sum function userange');
    try {
      const range = getRangeFromValues((args[0] as any).values, a.toString());
      const valueParameterNames = getRangeValueParameters(a.toString());
      let result = 0;
      console.log('range', range, valueParameterNames);
      range.map((value, index) => {
        if ((args[0] as any)[valueParameterNames[index]]) {
          result += Number((args[0] as any)[valueParameterNames[index]]) || 0;
        } else {
          result += Number(value) || 0;
        }
        return true;
      });

      return result;
    } catch (err) {
      console.log('exception in sum', err);
      return 0;
    }
  } else {
    // todo ... add other arguments as well
    return Number(a) + args[0];
  }
});

registerExpressionFunction('Math.PI', () => {
  return Math.PI;
});

registerExpressionFunction('Math.sin', (a: number) => {
  return Math.sin(a);
});

registerExpressionFunction('Math.pow', (a: number, ...args: number[]) => {
  return Math.pow(a, args[0]);
});

registerExpressionFunction('Math.floor', (a: number) => {
  return Math.floor(a);
});

registerExpressionFunction('Math.sqrt', (a: number) => {
  return Math.sqrt(a);
});

test('adds 2 and 3', () => {
  let tree = createExpressionTree('2+3');
  expect(executeExpressionTree(tree, {})).toBe(5);
});

test('calculates 2 * (2+3)', () => {
  let tree = createExpressionTree('2 * (2+3)');
  expect(executeExpressionTree(tree, {})).toBe(10);
});

test('calculates Math.pow(2,3)', () => {
  let tree = createExpressionTree('Math.pow(2,3)');
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
  logTree(tree, 0);
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
test('calculates Math.sin((t/100)-Math.sqrt(Math.pow(x-7.5,2)+Math.pow(y-6,2)))', () => {
  let tree = createExpressionTree(
    'Math.sin((t/100)-Math.sqrt(Math.pow(x-7.5,2)+Math.pow(y-6,2)))'
  );
  expect(
    Math.floor(executeExpressionTree(tree, { t: 0, x: 0, y: 0, i: 0 }))
  ).toBe(0);
});

test('calculates Math.sqrt(Math.pow(x-7.5,2)+Math.pow(y-6,2))', () => {
  let tree = createExpressionTree(
    'Math.sqrt(Math.pow(x-7.5,2)+Math.pow(y-6,2))'
  );
  expect(
    Math.floor(executeExpressionTree(tree, { t: 0, x: 0, y: 0, i: 0 }))
  ).toBe(9);
});

test('calculates Math.sqrt(Math.pow((x-7.5),2)+Math.pow((y-6),2))', () => {
  let tree = createExpressionTree('Math.sqrt(Math.pow(x+2,2)+Math.pow(y+3,2))');
  //let tree = createExpressionTree('Math.pow(x+2,2)+16');
  //let tree = createExpressionTree('25+16');
  //logTree(tree, 0);
  expect(
    Math.floor(executeExpressionTree(tree, { t: 0, x: 3, y: 1, i: 0 }))
  ).toBe(6);
});

test('basic runExpression', () => {
  const result = runExpression('6+7');
  expect(result).toBe(13);
});

test('basic runExpression with variables', () => {
  const result = runExpression('a * b', { a: 9, b: 8 });
  expect(result).toBe(72);
});

test('calculates with cells and rows', () => {
  let tree = createExpressionTree('sum(A1:A5)');
  //let tree = createExpressionTree('Math.pow(x+2,2)+16');
  //let tree = createExpressionTree('25+16');
  //logTree(tree, 0);
  const grid: any = [[5], [7], [8], [9], [19]];
  let values = convertGridToNamedVariables(grid);
  //console.log(values);
  expect(
    Math.floor(executeExpressionTree(tree, { ...values, values: grid }))
  ).toBe(48);
});

test('calculates 1&1', () => {
  let tree = createExpressionTree('1&1');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 1&0', () => {
  let tree = createExpressionTree('1&0');
  expect(executeExpressionTree(tree, {})).toBe(0);
});

test('calculates 1|0', () => {
  let tree = createExpressionTree('1|0');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 0|1', () => {
  let tree = createExpressionTree('0|1');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 0|0', () => {
  let tree = createExpressionTree('0|0');
  expect(executeExpressionTree(tree, {})).toBe(0);
});

test('calculates 1^1', () => {
  let tree = createExpressionTree('1^1');
  expect(executeExpressionTree(tree, {})).toBe(0);
});

test('calculates 1^0', () => {
  let tree = createExpressionTree('1^0');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 0^1', () => {
  let tree = createExpressionTree('0^1');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 5%3', () => {
  let tree = createExpressionTree('5%3');
  expect(executeExpressionTree(tree, {})).toBe(2);
});

test('calculates 27%13', () => {
  let tree = createExpressionTree('27%13');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 27>13', () => {
  let tree = createExpressionTree('27>13');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 1<1000', () => {
  let tree = createExpressionTree('1<1000');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 1>1000', () => {
  let tree = createExpressionTree('1>1000');
  expect(executeExpressionTree(tree, {})).toBe(0);
});

test('calculates ~15', () => {
  let tree = createExpressionTree('~15');
  expect(executeExpressionTree(tree, {})).toBe(-16);
});

test('calculates 1000>=1000', () => {
  let tree = createExpressionTree('1000>=1000');
  expect(executeExpressionTree(tree, {})).toBe(1);
});

test('calculates 5<<1', () => {
  let tree = createExpressionTree('5<<1');
  expect(executeExpressionTree(tree, {})).toBe(10);
});

test('calculates 5>>1', () => {
  let tree = createExpressionTree('5>>1');
  expect(executeExpressionTree(tree, {})).toBe(2);
});

test('calculates 3**2', () => {
  let tree = createExpressionTree('3**2');
  expect(executeExpressionTree(tree, {})).toBe(9);
});

test('compare named Value with string', () => {
  let tree = createExpressionTree('test=="hello"');
  expect(executeExpressionTree(tree, { test: 'hello' })).toBe(1);
});

test('compare named Value with string', () => {
  let tree = createExpressionTree('test=="hello"');
  expect(executeExpressionTree(tree, { test: 'test' })).toBe(0);
});

test('return string', () => {
  let tree = createExpressionTree('"hello"');
  logTree(tree, 0);
  expect(executeExpressionTree(tree, {})).toBe('hello');
});

test('compare 2 properties which are not equal', () => {
  let tree = createExpressionTree('test1 == test2');
  logTree(tree, 0);
  expect(
    executeExpressionTree(tree, {
      test1: 'abc',
      test2: 'def',
    })
  ).toBe(0);
});

test('compare 2 properties which are equal', () => {
  let tree = createExpressionTree('test1 == test2');
  logTree(tree, 0);
  expect(
    executeExpressionTree(tree, {
      test1: 'abc',
      test2: 'abc',
    })
  ).toBe(1);
});
