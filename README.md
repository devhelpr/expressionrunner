# Expressionrunner

Simple expression engine without external dependencies:

- Standard support for the following operators : / * + - % ** using BODMAS operator precedence
- Support for logic not and bitwise not
- Support for logic operators : && ||
- Support for bitwise operators : & | ^ ~ >> << >>>
- Support for "()" groups 
- Support for named variables in expressions
- Support for custom functions
- Support for pre-parsing and reusing the expression tree
- Written in typescript
- Its faster then JEXL.

## Getting started

```bash
npm install @devhelpr/expressionrunner --save # or yarn add @devhelpr/expressionrunner
```

```js
import { runExpression } from '@devhelpr/expressionrunner';

const result = runExpression("2+3");
alert(`result : ${result}`);
```

### Named variables

```js
import { runExpression } from '@devhelpr/expressionrunner';

const result = runExpression("a * b", {a:9,b:8});
alert(`result : ${result}`);
```


## TODO

- Support comparisons with strings (' and ") and boolean values
	- Support for specific keywords .. true and false

- Improve performance by only running ExpressionTreeExecuteForOperator for operators that are in the expression
- Refactor ExpressionTreeExecuteForOperator so that the code that executes the actual operator is in its own function and not in a big if statement
- Convert to Rust/Wasm

- Support for more datatypes : datetime, string, boolean
- Support for [] arrays and "in" keyword
- Support for multiple expressions separated by ,
- Support for assignments within expression

- Support for libaries of functions (math ...)

