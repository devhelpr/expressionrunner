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

import { JustADate } from '../src/utils/date-helper';
/*
const logTree = (tree: any, treeIndex: number) => {
  //return;

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
*/

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

registerExpressionFunction('hypot', (a: number, ...args: number[]) => {
  return Math.hypot(a, args[0]);
});

registerExpressionFunction('Math.floor', (a: number) => {
  return Math.floor(a);
});

registerExpressionFunction('Math.sqrt', (a: number) => {
  return Math.sqrt(a);
});

registerExpressionFunction('Math.add', (a: number, ...args: number[]) => {
  return a + args[0];
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
  //logTree(tree, 0);
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
  //logTree(tree, 0);
  expect(executeExpressionTree(tree, {})).toBe('hello');
});

test('compare 2 properties which are not equal', () => {
  let tree = createExpressionTree('test1 == test2');
  //logTree(tree, 0);
  expect(
    executeExpressionTree(tree, {
      test1: 'abc',
      test2: 'def',
    })
  ).toBe(0);
});

test('compare 2 properties which are equal', () => {
  let tree = createExpressionTree('test1 == test2');
  //logTree(tree, 0);
  expect(
    executeExpressionTree(tree, {
      test1: 'abc',
      test2: 'abc',
    })
  ).toBe(1);
});

test('compare 2 empty properties which are equal', () => {
  let tree = createExpressionTree('test1 == test2');
  //logTree(tree, 0);
  expect(
    executeExpressionTree(tree, {
      test1: '',
      test2: '',
    })
  ).toBe(1);
});

test('compare 2 properties where one is empty and the other not', () => {
  let tree = createExpressionTree('test1 == test2');
  //logTree(tree, 0);
  expect(
    executeExpressionTree(tree, {
      test1: 'abc',
      test2: '',
    })
  ).toBe(0);
});

test('run 8*t/1000%13 - hypot(x-7.5, y-7.5)', () => {
  let tree = createExpressionTree('8*t/1000%13 - hypot(x-7.5, y-7.5)');
  //logTree(tree, 0);
  expect(
    Math.floor(
      executeExpressionTree(tree, {
        x: 1,
        y: 2,
        t: 1,
        i: 0,
      })
    )
  ).toBe(-9);
});

test('run true', () => {
  let tree = createExpressionTree('true');
  //logTree(tree, 0);
  expect(executeExpressionTree(tree, {})).toBe(true);
});

test('run date now', () => {
  let dateNow = JustADate();
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);

  const dateString = dateNow.toISOString();

  //  expressions that should work:

  //  - date.now() + "2d"
  //    add 2 days
  //  - date.now() + "2m"
  //    add 2 months
  //  - date.now() - "2y"
  //    add 2 years
  //  - date.now() - "2d"
  //    subtract 2 days

  //  - date.now() + date("0002:05:10")
  //      (0002:05:10 means 2 years 5 months and 10 days)

  //  - date.now() === date("2020-12-25")
  //      result is true if they match

  //  - date.now() - date("1973-06-13")
  //      result is date string representing your age

  // - date("2020-12-05") - date("1973-06-13")
  //      result is difference in date string format

  //  alternative approach:

  //  date.addDays("date", days)
  //  date.addDays(date.now(), days)

  let tree = createExpressionTree('date.now()');
  let dateReturned = executeExpressionTree(tree, {});
  console.log('dateNow dateReturned', dateString, dateReturned);
  //logTree(tree, 0);
  expect(dateReturned).toStrictEqual(dateString);
});

test('run date set', () => {
  let dateSet = JustADate('2021-01-01');
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);

  const dateString = dateSet.toISOString();

  let tree = createExpressionTree('date("2021-01-01")');
  let dateReturned = executeExpressionTree(tree, {});
  console.log('dateString dateReturned', dateString, dateReturned);
  //logTree(tree, 0);
  expect(dateReturned).toStrictEqual(dateString);
});

test('add 2 days', () => {
  let dateSet = JustADate('2021-02-02');
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);
  //dateSet.addDays(2);
  const dateString = dateSet.toISOString();

  let tree = createExpressionTree('date.addDays("2021-01-31",2)');
  let dateReturned = executeExpressionTree(tree, {});
  console.log('dateString dateReturned', dateString, dateReturned);
  //logTree(tree, 0);
  expect(dateReturned).toStrictEqual(dateString);
});

test('subtract 2 days', () => {
  let dateSet = JustADate('2021-01-29');
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);
  //dateSet.addDays(2);
  const dateString = dateSet.toISOString();

  let tree = createExpressionTree('date.addDays("2021-01-31",-2)');
  let dateReturned = executeExpressionTree(tree, {});
  console.log('dateString dateReturned', dateString, dateReturned);
  //logTree(tree, 0);
  expect(dateReturned).toStrictEqual(dateString);
});

test('add 2 days to date.now', () => {
  let dateSet = JustADate();
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);
  dateSet.addDays(2);
  const dateString = dateSet.toISOString();

  let tree = createExpressionTree('date.addDays(date.now() , 2)');
  let dateReturned = executeExpressionTree(tree, {});
  console.log('add 2 days to date.now', dateString, dateReturned);

  //logTree(tree, 0);
  expect(dateReturned).toStrictEqual(dateString);
});

test('add 3 months to date.now', () => {
  let dateSet = JustADate();
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);
  dateSet.addMonths(3);
  const dateString = dateSet.toISOString();

  let tree = createExpressionTree('date.addMonths(date.now() , 3)');
  let dateReturned = executeExpressionTree(tree, {});
  console.log('add 3 months to date.now', dateString, dateReturned);

  //logTree(tree, 0);
  expect(dateReturned).toStrictEqual(dateString);
});

test('add 3 years to date.now', () => {
  let dateSet = JustADate();
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);
  dateSet.addYears(3);
  const dateString = dateSet.toISOString();

  let tree = createExpressionTree('date.addYears(date.now() , 3)');
  let dateReturned = executeExpressionTree(tree, {});
  console.log('add 3 years to date.now', dateString, dateReturned);

  //logTree(tree, 0);
  expect(dateReturned).toStrictEqual(dateString);
});

test('diff between date.now', () => {
  let dateSet = JustADate();
  //let dateUTC = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth() , dateNow.getUTCDate()))
  //dateUTC.setHours(0,0,0,0);
  const result = dateSet.diffYears(JustADate('1973-06-13'));

  let tree = createExpressionTree('date.diffYears(date.now(), "1973-06-13")');
  let resultReturned = executeExpressionTree(tree, {});
  console.log('difference between two dates', result, resultReturned);

  //logTree(tree, 0);
  expect(resultReturned).toStrictEqual(result);
});

test('compare dates', () => {
  let tree = createExpressionTree('date.compare("1973-06-13", date.now())');
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two dates', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(-1);
});

test('compare dates with expression approach 1', () => {
  let tree = createExpressionTree(
    'date.compare("1973-06-13", date.now()) == (-1)'
  );
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two dates', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(1);
});

test('compare dates with expression approach 2', () => {
  let tree = createExpressionTree('date.compare("1973-06-13", date.now()) < 0');
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two dates', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(1);
});

test('compare dates with expression bigger', () => {
  let tree = createExpressionTree(
    'date.compare("2022-01-01", "1973-06-13") > 0'
  );
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two dates bigger', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(1);
});

test('compare dates with expression bigger 2', () => {
  let tree = createExpressionTree('date.compare(date.now(), "1973-06-13") > 0');
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two dates bigger', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(1);
});

test('compare dates equal with expression', () => {
  let tree = createExpressionTree('date.compare(date.now(), date.now()) == 0');
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two dates equal', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(1);
});

test('compare function results', () => {
  let tree = createExpressionTree('Math.floor(1) < Math.floor(2)');
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two function results', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(1);
});

test('compare date strings', () => {
  let tree = createExpressionTree('"1973-06-13" < "2021-01-01"');
  let resultReturned = executeExpressionTree(tree, {});
  console.log('compare two function results', resultReturned);
  //logTree(tree, 0);
  expect(resultReturned).toBe(1);
});

test('Math.add(Math.PI(), 5)', () => {
  let tree = createExpressionTree('Math.add(Math.PI(),5)');
  //logTree(tree, 0);

  let result = Math.floor(executeExpressionTree(tree, {}));
  expect(result).toStrictEqual(8);
});

test("iemandhuishoudencorona10dgn=='nee' && huisgenootmetkoortsofbenauwdheid=='ja'", () => {
  let tree = createExpressionTree(
    "(iemandhuishoudencorona10dgn=='nee') && (huisgenootmetkoortsofbenauwdheid=='ja')"
  );
  //logTree(tree, 0);

  let result = Math.floor(
    executeExpressionTree(tree, {
      huisgenootmetkoortsofbenauwdheid: 'ja',
      iemandhuishoudencorona10dgn: 'nee',
    })
  );
  expect(result).toStrictEqual(1);
});

test("(iemandhuishoudencorona10dgn=='nee') && ((huisgenootmetkoortsofbenauwdheid=='nee') || (heeftbroertjezusjeafg10dgncontactmetcorona=='nee'))", () => {
  let tree = createExpressionTree(
    "(iemandhuishoudencorona10dgn=='nee') && ((huisgenootmetkoortsofbenauwdheid=='nee') || (heeftbroertjezusjeafg10dgncontactmetcorona=='nee'))"
  );
  //logTree(tree, 0);

  let result = Math.floor(
    executeExpressionTree(tree, {
      huisgenootmetkoortsofbenauwdheid: 'ja',
      iemandhuishoudencorona10dgn: 'nee',
      heeftbroertjezusjeafg10dgncontactmetcorona: 'nee',
    })
  );
  expect(result).toStrictEqual(1);
});

test("ongeldige waardes: (iemandhuishoudencorona10dgn=='nee') && ((huisgenootmetkoortsofbenauwdheid=='nee') || (heeftbroertjezusjeafg10dgncontactmetcorona=='nee'))", () => {
  let tree = createExpressionTree(
    "(iemandhuishoudencorona10dgn=='nee') && ((huisgenootmetkoortsofbenauwdheid=='nee') || (heeftbroertjezusjeafg10dgncontactmetcorona=='nee'))"
  );
  //logTree(tree, 0);

  let result = Math.floor(
    executeExpressionTree(tree, {
      huisgenootmetkoortsofbenauwdheid: 'ja',
      iemandhuishoudencorona10dgn: '',
      heeftbroertjezusjeafg10dgncontactmetcorona: '',
    })
  );
  expect(result).toStrictEqual(0);
});
