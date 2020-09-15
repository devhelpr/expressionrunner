import {
  invalidOperatorAfterOperator,
  invalidCloseTag,
} from './expression-resource-strings';

export enum ExpressionState {
  empty,
  numeric,
  operator,
  alpha,
  group,
}

export enum ExpressionNodeType {
  numeric,
  operator,
  alpha,
  expression,
  parameters,
}

export interface ExpressionNode {
  nodeType: ExpressionNodeType;
  value?: any;
  nodes: ExpressionNode[];
  parentNode?: ExpressionNode;
}

let expressionState: ExpressionState = ExpressionState.empty;
const alphaRegex = new RegExp(/^[a-zA-Z]+$/i);

export function ExpressionParser(expression: string) {
  let numericValue = '';
  let currentOperator = '';
  let alphaValue = '';

  let rootNode: ExpressionNode = {
    nodeType: ExpressionNodeType.expression,
    nodes: [],
  };

  let currentNode = rootNode;

  expressionState = ExpressionState.empty;
  let index = 0;
  let character = '';
  while (index < expression.length) {
    character = expression.charAt(index);
    if (
      expressionState === ExpressionState.empty ||
      expressionState === ExpressionState.group
    ) {
      if ((character >= '0' && character <= '9') || character === '.') {
        numericValue = character;
        currentOperator = '';
        expressionState = ExpressionState.numeric;
      }

      if (character === ',') {
        if (
          currentNode.parentNode &&
          currentNode.parentNode.nodeType === ExpressionNodeType.expression
        ) {
          // parameters belong to a node higher in the tree .. so move currentNode pointer to that node
          currentNode.parentNode.nodeType = ExpressionNodeType.parameters;
          currentNode = currentNode.parentNode;
        } else {
          currentNode.nodeType = ExpressionNodeType.parameters;
        }
      }

      if ('+-/*^'.indexOf(character) >= 0) {
        let numericNode = {
          nodeType: ExpressionNodeType.numeric,
          nodes: [],
          value: 0,
          parentNode: currentNode,
        };
        currentNode.nodes.push(numericNode);

        currentOperator = character;
        expressionState = ExpressionState.operator;
      }

      if (character === '(') {
        expressionState = ExpressionState.group;

        let expressionNode = {
          nodeType: ExpressionNodeType.expression,
          nodes: [],
          value: 0,
          parentNode: currentNode,
        };
        currentNode.nodes.push(expressionNode);
        currentNode = expressionNode;
      }

      if ((character.toString().match(alphaRegex) || []).length > 0) {
        alphaValue = character.toString();
        currentOperator = '';
        expressionState = ExpressionState.alpha;
      }

      if (character === ')') {
        if (currentNode.nodeType === ExpressionNodeType.parameters) {
          currentNode = currentNode.parentNode as ExpressionNode;
          expressionState = ExpressionState.empty;
        } else if (currentNode.nodeType === ExpressionNodeType.expression) {
          currentNode = currentNode.parentNode as ExpressionNode;
          expressionState = ExpressionState.empty;
        } else if (
          currentNode.parentNode &&
          currentNode.parentNode.nodeType === ExpressionNodeType.expression
        ) {
          currentNode = currentNode.parentNode as ExpressionNode;
          expressionState = ExpressionState.empty;
        } else {
          console.log(
            invalidCloseTag,
            currentNode,
            rootNode,
            expressionState,
            currentOperator,
            character
          );
          throw new Error(invalidCloseTag);
        }
      }

      if (character === ' ') {
        // skip space
      }
    } else if (expressionState === ExpressionState.numeric) {
      if ((character >= '0' && character <= '9') || character === '.') {
        numericValue += character;
      } else if (character === ')') {
        let numericNode = {
          nodeType: ExpressionNodeType.numeric,
          nodes: [],
          value: parseFloat(numericValue),
          parentNode: currentNode,
        };
        currentNode.nodes.push(numericNode);

        currentNode = currentNode.parentNode as ExpressionNode;

        if (currentNode.parentNode) {
          currentNode = currentNode.parentNode as ExpressionNode;
        }

        expressionState = ExpressionState.empty;
      } else if (character === ',') {
        let numericNode = {
          nodeType: ExpressionNodeType.numeric,
          nodes: [],
          value: parseFloat(numericValue),
          parentNode: currentNode,
        };
        currentNode.nodes.push(numericNode);
        currentNode.nodeType = ExpressionNodeType.parameters;
        expressionState = ExpressionState.empty;
      } else if ('+-/*^'.indexOf(character) >= 0) {
        let numericNode = {
          nodeType: ExpressionNodeType.numeric,
          nodes: [],
          value: parseFloat(numericValue),
          parentNode: currentNode,
        };
        currentNode.nodes.push(numericNode);

        numericValue = '';
        currentOperator = character;
        expressionState = ExpressionState.operator;
      } else if (character === ' ') {
      }
    } else if (expressionState === ExpressionState.operator) {
      if ((character >= '0' && character <= '9') || character === '.') {
        let operatorNode = {
          nodeType: ExpressionNodeType.operator,
          nodes: [],
          value: currentOperator,
          parentNode: currentNode,
        };
        currentNode.nodes.push(operatorNode);

        numericValue = character;
        expressionState = ExpressionState.numeric;

        currentOperator = '';
      } else if ((character.toString().match(alphaRegex) || []).length > 0) {
        let operatorNode = {
          nodeType: ExpressionNodeType.operator,
          nodes: [],
          value: currentOperator,
          parentNode: currentNode,
        };
        currentNode.nodes.push(operatorNode);

        alphaValue = character.toString();
        expressionState = ExpressionState.alpha;

        currentOperator = '';
      } else if (character === '(') {
        let operatorNode = {
          nodeType: ExpressionNodeType.operator,
          nodes: [],
          value: currentOperator,
        };
        currentNode.nodes.push(operatorNode);
        currentOperator = '';

        expressionState = ExpressionState.group;

        let expressionNode = {
          nodeType: ExpressionNodeType.expression,
          nodes: [],
          value: 0,
          parentNode: currentNode,
        };
        currentNode.nodes.push(expressionNode);
        currentNode = expressionNode;
      } else if (character === ' ') {
        let operatorNode = {
          nodeType: ExpressionNodeType.operator,
          nodes: [],
          value: currentOperator,
          parentNode: currentNode,
        };
        currentNode.nodes.push(operatorNode);
        currentOperator = '';
        expressionState = ExpressionState.empty;
      } else if ('+-/*^'.indexOf(character) >= 0) {
        console.error(
          invalidOperatorAfterOperator,
          rootNode,
          expressionState,
          currentOperator,
          character
        );
        throw new Error(invalidOperatorAfterOperator);
      }
    } else if (expressionState === ExpressionState.alpha) {
      if (
        (character >= '0' && character <= '9') ||
        character === '.' ||
        character === ':' ||
        (character.toString().match(alphaRegex) || []).length > 0
      ) {
        alphaValue += character.toString();
      } else if (character === '(') {
        let alphaNode = {
          nodeType: ExpressionNodeType.alpha,
          nodes: [],
          value: alphaValue,
          parentNode: currentNode,
        };
        currentNode.nodes.push(alphaNode);
        alphaValue = '';

        expressionState = ExpressionState.group;

        let expressionNode = {
          nodeType: ExpressionNodeType.expression,
          nodes: [],
          value: 0,
          parentNode: alphaNode,
        };
        alphaNode.nodes.push(expressionNode as never);
        currentNode = expressionNode;
      } else if (character === ')') {
        let alphaNode = {
          nodeType: ExpressionNodeType.alpha,
          nodes: [],
          value: alphaValue,
          parentNode: currentNode,
        };
        currentNode.nodes.push(alphaNode);
        alphaValue = '';
        currentNode = currentNode.parentNode as ExpressionNode;
        expressionState = ExpressionState.empty;
      } else if (character === ',') {
        let alphaNode = {
          nodeType: ExpressionNodeType.alpha,
          nodes: [],
          value: alphaValue,
          parentNode: currentNode,
        };
        currentNode.nodes.push(alphaNode);
        currentNode.nodeType = ExpressionNodeType.parameters;
        alphaValue = '';
        expressionState = ExpressionState.empty;
      } else if ('+-/*^'.indexOf(character) >= 0) {
        let alphaNode = {
          nodeType: ExpressionNodeType.alpha,
          nodes: [],
          value: alphaValue,
          parentNode: currentNode,
        };
        currentNode.nodes.push(alphaNode);

        alphaValue = '';
        currentOperator = character;
        expressionState = ExpressionState.operator;
      } else if (character === ' ') {
        // skip
      }
    }

    index++;
  }

  if (expressionState === ExpressionState.numeric) {
    let numericNode = {
      nodeType: ExpressionNodeType.numeric,
      nodes: [],
      value: parseFloat(numericValue),
      parentNode: currentNode,
    };
    currentNode.nodes.push(numericNode);
  } else if (expressionState === ExpressionState.alpha) {
    let alphaNode = {
      nodeType: ExpressionNodeType.alpha,
      nodes: [],
      value: alphaValue,
      parentNode: currentNode,
    };
    currentNode.nodes.push(alphaNode);
  } else if (expressionState === ExpressionState.operator) {
    let operatorNode = {
      nodeType: ExpressionNodeType.operator,
      nodes: [],
      value: currentOperator,
      parentNode: currentNode,
    };
    currentNode.nodes.push(operatorNode);
  }

  numericValue = '';
  currentOperator = '';
  expressionState = ExpressionState.empty;

  return rootNode;
}

export function createExpressionTree(expression: string) {
  return ExpressionParser(expression);
}
