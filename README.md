# Expressionrunner

Simple expression engine without external dependencies:

- Standard support for the following operators : / * + - % 
- Support for logic operators : & | ^ > < !
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
