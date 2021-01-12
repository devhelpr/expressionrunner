import { ExpressionNode, ExpressionNodeType } from './expression-parser';
import {
  getFunction,
  getKeyword,
  doesKeywordFunctionExist,
} from './expression-keywords';
import {
  isRangeValue,
  convertGridToNamedVariables,
} from '../utils/grid-values';
/*
	- Add support namespaces ..

		Number(values[node.value]) 

			node.value can contain a namespace (. separator)
			.. split into namespace and variableName
			.. if so, then use values[namespace]
			.. is variableName a cellReference? (like A12)
				 .. if so .. check if it exists in the namespace and use the found value
				 .. if not check it a name values[namespace][variableName]

			.. an external registered function can also have a '.' and has priority

	- Add support for ranges like A1:C3

*/

let expressionFunctions: any = {};

let nameSpaceCache = {};

export function clearExpressionFunctions() {
  expressionFunctions = {};
}

export function registerExpressionFunction(
  name: string,
  expressionFunction: (value: number, ...args: number[]) => number
) {
  expressionFunctions[name] = expressionFunction;
}

export function isExpressionFunction(name: string): boolean {
  return expressionFunctions[name] !== undefined;
}

function isLastNodeOfOperatorOrValue(
  nodesStack: ExpressionNode[],
  operator: string
) {
  if (nodesStack.length > 0) {
    const lastNode = nodesStack[nodesStack.length - 1];
    return (
      (lastNode.nodeType === ExpressionNodeType.operator &&
        lastNode.value === operator) ||
      lastNode.nodeType === ExpressionNodeType.numeric ||
      lastNode.nodeType === ExpressionNodeType.alpha ||
      lastNode.nodeType === ExpressionNodeType.string
    );
  }
  return false;
}

function ExpressionTreeExecuteForOperator(
  expressionTree: ExpressionNode,
  operator: string[],
  values: any
) {
  if (expressionTree.nodes.length > 0) {
    let currentExpressionNodeType = ExpressionNodeType.expression;

    let currentRawValue: any = undefined;
    let currentValue = 0;
    let currentOperator = '';

    let nodesStack: ExpressionNode[] = [];
    let nodes: ExpressionNode[] = [];
    let currentNode: any = undefined;

    expressionTree.nodes.map(node => {
      if (
        node.nodeType === ExpressionNodeType.numeric &&
        (currentExpressionNodeType === ExpressionNodeType.expression ||
          currentExpressionNodeType === ExpressionNodeType.parameterGroup)
      ) {
        currentValue = node.value;
        currentRawValue = node.rawValue;
        currentExpressionNodeType = node.nodeType;
        nodesStack.push(node);
      } else if (
        node.nodeType === ExpressionNodeType.string &&
        (currentExpressionNodeType === ExpressionNodeType.expression ||
          currentExpressionNodeType === ExpressionNodeType.parameterGroup)
      ) {
        currentValue = node.value;
        currentRawValue = node.value;
        currentExpressionNodeType = node.nodeType;
        nodesStack.push(node);
      } else if (node.nodeType === ExpressionNodeType.alpha) {
        if (getKeyword(node.value)) {
          const keywordValue = getKeyword(node.value);
          let newNode = {
            value: keywordValue,
            rawValue: keywordValue,
            nodeType: ExpressionNodeType.numeric,
            nodes: [],
          };
          nodesStack.push(newNode);
        } else if (doesKeywordFunctionExist(node.value)) {
          let parameters: any[] = [];

          let nodesHelper: ExpressionNode = {
            nodes: [],
            nodeType: ExpressionNodeType.expression,
            value: 0,
          };
          let nodeForParameterExtraction = node;
          if (
            node.nodes.length === 1 &&
            (node.nodes[0].nodeType === ExpressionNodeType.expression ||
              node.nodes[0].nodeType === ExpressionNodeType.parameterGroup)
          ) {
            nodeForParameterExtraction = node.nodes[0];
          }
          nodeForParameterExtraction.nodes.map((node: any) => {
            if (node.nodeType !== ExpressionNodeType.parameterSeparator) {
              nodesHelper.nodes.push(node);
            } else {
              const value = ExpressionTreeExecute(nodesHelper, values);

              parameters.push(value);

              nodesHelper = {
                nodes: [],
                nodeType: ExpressionNodeType.expression,
                value: 0,
              };
            }
            return null;
          });

          if (nodesHelper.nodes.length > 0) {
            const value = ExpressionTreeExecute(nodesHelper, values);
            parameters.push(value);
          }
          //console.log("keyword func",node.value, parameters, nodeForParameterExtraction);
          const functionReturnValue = getFunction(node.value, ...parameters);
          let newNode = {
            value: functionReturnValue,
            rawValue: functionReturnValue,
            nodeType:
              typeof functionReturnValue == 'number'
                ? ExpressionNodeType.numeric
                : ExpressionNodeType.string,
            nodes: [],
          };
          nodesStack.push(newNode);
        } else if (node.nodes.length > 0 && expressionFunctions[node.value]) {
          let parameters: any[] = [];

          let nodesHelper: ExpressionNode = {
            nodes: [],
            nodeType: ExpressionNodeType.expression,
            value: 0,
          };
          let nodeForParameterExtraction = node;
          if (
            node.nodes.length === 1 &&
            (node.nodes[0].nodeType === ExpressionNodeType.expression ||
              node.nodes[0].nodeType === ExpressionNodeType.parameterGroup)
          ) {
            nodeForParameterExtraction = node.nodes[0];
          }
          nodeForParameterExtraction.nodes.map((node: any) => {
            if (node.nodeType !== ExpressionNodeType.parameterSeparator) {
              nodesHelper.nodes.push(node);
            } else {
              //console.log("execute tree for ", nodes);
              const value = ExpressionTreeExecute(nodesHelper, values);
              //console.log("with result", value);

              if (isRangeValue(value)) {
                // this shouldn't happen currently
                // .. perhaps later when we support functions with ranges as paramters like vlookup ???
                parameters.push(expressionFunctions[node.value](value, values));
              } else {
                parameters.push(value);
              }

              nodesHelper = {
                nodes: [],
                nodeType: ExpressionNodeType.expression,
                value: 0,
              };
            }
            return null;
          });
          let usesRange: boolean = false;
          if (nodesHelper.nodes.length > 0) {
            //console.log("execute tree for ", nodes);

            const value = ExpressionTreeExecute(nodesHelper, values);
            if (isRangeValue(value)) {
              usesRange = true;
              currentValue = expressionFunctions[node.value](value, values);
              currentRawValue = currentValue;
            } else {
              parameters.push(value);
            }
          }
          if (!usesRange) {
            currentValue = expressionFunctions[node.value](...parameters);
            currentRawValue = currentValue;
          }
          //console.log("function", node.value , "parameters" , parameters , "result", currentValue);
          /*
            const value = ExpressionTreeExecute(nodes, values);
            if (isRangeValue(value)) {
              if (values.values) {
                currentValue = expressionFunctions[node.value](value, values);
              } else {
                currentValue = 0;
              }
            } else {
              currentValue = expressionFunctions[node.value](value);
            }
            */
        } else {
          if (isRangeValue(node.value)) {
            currentValue = node.value;
            currentRawValue = currentValue;
          } else {
            if (node.value.indexOf('.') > 0) {
              currentValue = 0;
              const splitted = node.value.split('.');
              if (splitted.length === 2) {
                if ((nameSpaceCache as any)[splitted[0]]) {
                  currentValue = (nameSpaceCache as any)[splitted[0]][
                    splitted[1]
                  ];
                } else {
                  const variables = convertGridToNamedVariables(
                    values[splitted[0]]
                  );
                  (nameSpaceCache as any)[splitted[0]] = variables;
                  currentRawValue = variables[splitted[1]];
                  currentValue = Number(currentRawValue) || 0;
                }
              }
            } else {
              currentRawValue = values[node.value];
              currentValue = Number(currentRawValue) || 0;
            }
          }
        }

        if (typeof currentRawValue == 'string') {
          currentExpressionNodeType = ExpressionNodeType.string;
          (currentValue as any) = currentRawValue;
        } else {
          currentExpressionNodeType = ExpressionNodeType.numeric;
        }
        let newNode = {
          value: currentValue,
          rawValue: currentRawValue,
          nodeType: currentExpressionNodeType,
          nodes: [],
        };
        nodesStack.push(newNode);
      } else if (
        node.nodeType === ExpressionNodeType.operator &&
        (currentExpressionNodeType === ExpressionNodeType.expression ||
          currentExpressionNodeType === ExpressionNodeType.parameterGroup)
      ) {
        currentOperator = node.value;
        currentExpressionNodeType = node.nodeType;
        if (currentNode !== undefined) {
          nodesStack.push(currentNode);
        }
        nodesStack.push(node);
      } else if (
        (node.nodeType === ExpressionNodeType.operator &&
          currentExpressionNodeType === ExpressionNodeType.string) ||
        (node.nodeType === ExpressionNodeType.operator &&
          currentExpressionNodeType === ExpressionNodeType.alpha) ||
        (node.nodeType === ExpressionNodeType.operator &&
          currentExpressionNodeType === ExpressionNodeType.numeric)
      ) {
        currentOperator = node.value;
        currentExpressionNodeType = node.nodeType;

        nodesStack.push(node);
      } else if (
        (node.nodeType === ExpressionNodeType.numeric ||
          node.nodeType === ExpressionNodeType.string) &&
        currentExpressionNodeType === ExpressionNodeType.operator
      ) {
        currentExpressionNodeType = ExpressionNodeType.numeric;
        let valueForExpression = 0;

        valueForExpression = node.value;

        if (currentOperator === '^' && operator.indexOf(currentOperator) >= 0) {
          //currentValue = Math.pow(currentValue, valueForExpression);
          currentValue ^= valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '^')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '%' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue %= valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '%')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '<<' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = currentValue << valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '<<')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '>>>' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = currentValue >>> valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '>>>')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '>>' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = currentValue >> valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '>>')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '&&' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          //console.log("&& result", currentValue , valueForExpression, currentValue && valueForExpression);
          currentValue = currentValue && valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '&&')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '||' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = currentValue || valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '||')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '&' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue &= valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '&')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '|' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue |= valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '|')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '>=' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = Number(currentValue >= valueForExpression);

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '>=')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '>' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = Number(currentValue > valueForExpression);

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '>')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '<=' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = Number(currentValue <= valueForExpression);

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '<=')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '<' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = Number(currentValue < valueForExpression);

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '<')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '!' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = Number(!valueForExpression);

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '!')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '~' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = Number(~valueForExpression);
          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '~')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '+' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue += valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '+')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '-' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue -= valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '-')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '**' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue = currentValue ** valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '**')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '==' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          if (node.nodeType === ExpressionNodeType.string) {
            // eslint-disable-next-line
            currentValue = Number(currentRawValue == valueForExpression);
          } else {
            currentValue = Number(currentValue === valueForExpression);
          }

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '==')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '*' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue *= valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '*')) {
            nodesStack.pop();
          }
        } else if (
          currentOperator === '/' &&
          operator.indexOf(currentOperator) >= 0
        ) {
          currentValue /= valueForExpression;

          currentNode = {
            nodeType: ExpressionNodeType.numeric,
            value: currentValue,
            nodes: [],
          };
          nodesStack.pop();
          if (isLastNodeOfOperatorOrValue(nodesStack, '/')) {
            nodesStack.pop();
          }
        } else {
          if (currentNode !== undefined) {
            const operator: ExpressionNode = nodesStack.pop() as ExpressionNode;
            nodesStack.push(currentNode);
            currentNode = undefined;
            nodesStack.push(operator);
          }
          currentValue = valueForExpression;
          nodesStack.push(node);
        }
      }

      return node;
    });

    if (nodesStack.length > 0) {
      nodes.push(...nodesStack);
    }

    if (currentNode !== undefined) {
      nodes.push(currentNode);
    }

    return {
      nodes: nodes,
      nodeType: ExpressionNodeType.expression,
    };
  }

  return {
    nodes: [],
    nodeType: ExpressionNodeType.expression,
    value: 0,
  };
}

function ExpressionTreeExecute(expressionTree: ExpressionNode, values: any) {
  if (expressionTree.nodes.length > 0) {
    let nodeList: ExpressionNode[] = expressionTree.nodes.map(node => {
      if (
        (node.nodeType === ExpressionNodeType.parameterGroup ||
          node.nodeType === ExpressionNodeType.expression) &&
        node.nodes.length > 0
      ) {
        let value = ExpressionTreeExecute(node, values);
        let newNode = {
          value: value,
          rawValue: value,
          nodeType: ExpressionNodeType.numeric,
          nodes: [],
        };
        return newNode;
      }
      return node;
    });

    let nodes: ExpressionNode = {
      nodes: nodeList,
      nodeType: ExpressionNodeType.expression,
      value: 0,
    };

    // .. if the first is removed.. then tests fail
    // .. in the first iteration the variables are replaced
    nodes = ExpressionTreeExecuteForOperator(nodes, [], values);
    nodes = ExpressionTreeExecuteForOperator(nodes, ['!', '~'], values);
    nodes = ExpressionTreeExecuteForOperator(
      nodes,
      ['/', '*', '**', '%'],
      values
    );
    nodes = ExpressionTreeExecuteForOperator(nodes, ['+', '-'], values);
    nodes = ExpressionTreeExecuteForOperator(
      nodes,
      ['>>', '<<', '>>>'],
      values
    );
    nodes = ExpressionTreeExecuteForOperator(
      nodes,
      ['=', '<', '>', '>=', '<=', '=='],
      values
    );
    nodes = ExpressionTreeExecuteForOperator(nodes, ['^', '&', '|'], values);
    nodes = ExpressionTreeExecuteForOperator(nodes, ['&&', '||'], values);
    if (nodes.nodes.length > 0) {
      return nodes.nodes[0].value;
    }
    return 0;
  }

  return false;
}

export function executeExpressionTree(
  expressionTree: ExpressionNode,
  values: any
) {
  nameSpaceCache = {};
  return ExpressionTreeExecute(expressionTree, values);
}

export function extractValueParametersFromExpressionTree(
  tree: ExpressionNode
): string[] {
  const extractDeeper = (): string[] => {
    let result = tree.nodes.map((node: ExpressionNode) => {
      return [...extractValueParametersFromExpressionTree(node)];
    });
    let parameters: string[] = [];
    result.map(parameter => {
      parameter.map(parameterName => {
        parameters.push(parameterName);
        return true;
      });
      return true;
    });
    return parameters;
  };

  if (tree && tree.nodeType === ExpressionNodeType.alpha) {
    if (!isExpressionFunction(tree.value)) {
      return [tree.value];
    } else {
      return extractDeeper();
    }
  } else if (
    tree &&
    (tree.nodeType === ExpressionNodeType.expression ||
      tree.nodeType === ExpressionNodeType.parameterGroup ||
      tree.nodeType === ExpressionNodeType.parameters)
  ) {
    return extractDeeper();
  }
  return [];
}
