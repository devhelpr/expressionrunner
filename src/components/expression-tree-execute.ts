import { ExpressionNode, ExpressionNodeType } from './expression-parser';
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
      lastNode.nodeType === ExpressionNodeType.alpha
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

    let currentValue = 0;
    let currentOperator = '';

    let nodesStack: ExpressionNode[] = [];
    let nodes: ExpressionNode[] = [];
    let currentNode: any = undefined;

    expressionTree.nodes.map(node => {
      if (
        node.nodeType === ExpressionNodeType.numeric &&
        currentExpressionNodeType === ExpressionNodeType.expression
      ) {
        currentValue = node.value;
        currentExpressionNodeType = node.nodeType;

        nodesStack.push(node);
      } else if (node.nodeType === ExpressionNodeType.alpha) {
        if (node.nodes.length > 0 && expressionFunctions[node.value]) {
          let parameters: any[] = [];

          let nodesHelper: ExpressionNode = {
            nodes: [],
            nodeType: ExpressionNodeType.expression,
            value: 0,
          };
          let nodeForParameterExtraction = node;
          if (
            node.nodes.length === 1 &&
            node.nodes[0].nodeType === ExpressionNodeType.expression
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
            } else {
              parameters.push(value);
            }
          }
          if (!usesRange) {
            currentValue = expressionFunctions[node.value](...parameters);
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

                  currentValue = Number(variables[splitted[1]]) || 0;
                }
              }
            } else {
              currentValue = Number(values[node.value]) || 0;
            }
          }
        }
        currentExpressionNodeType = ExpressionNodeType.numeric;

        let newNode = {
          value: currentValue,
          nodeType: ExpressionNodeType.numeric,
          nodes: [],
        };
        nodesStack.push(newNode);
      } else if (
        node.nodeType === ExpressionNodeType.operator &&
        currentExpressionNodeType === ExpressionNodeType.expression
      ) {
        currentOperator = node.value;
        currentExpressionNodeType = node.nodeType;
        if (currentNode !== undefined) {
          nodesStack.push(currentNode);
        }
        nodesStack.push(node);
      } else if (
        (node.nodeType === ExpressionNodeType.operator &&
          currentExpressionNodeType === ExpressionNodeType.alpha) ||
        (node.nodeType === ExpressionNodeType.operator &&
          currentExpressionNodeType === ExpressionNodeType.numeric)
      ) {
        currentOperator = node.value;
        currentExpressionNodeType = node.nodeType;

        nodesStack.push(node);
      } else if (
        node.nodeType === ExpressionNodeType.numeric &&
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
          // TODO : add 'skip lint' rule here .. to be able to use == instead of ===
          currentValue = Number(currentValue === valueForExpression);

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
        node.nodeType === ExpressionNodeType.expression &&
        node.nodes.length > 0
      ) {
        let newNode = {
          value: ExpressionTreeExecute(node, values),
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
      tree.nodeType === ExpressionNodeType.parameters)
  ) {
    return extractDeeper();
  }
  return [];
}
