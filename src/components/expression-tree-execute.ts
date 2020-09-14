import { ExpressionNode, ExpressionNodeType } from './expression-parser';
import { isRangeValue , convertGridToNamedVariables} from '../utils/grid-values';
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

let expressionFunctions : any = {

}

let nameSpaceCache = {

};

export function clearExpressionFunctions() {
	expressionFunctions = {};
}

export function registerExpressionFunction(name : string, expressionFunction : (value : number, ...args : number[]) => number) {
	expressionFunctions[name] = expressionFunction;
}

export function isExpressionFunction(name : string) : boolean {
	return expressionFunctions[name] !== undefined;
}


function ExpressionTreeExecuteForOperator(expressionTree: ExpressionNode, operator : string, values : any) {
	if (expressionTree.nodes.length > 0) {
		let currentExpressionNodeType = ExpressionNodeType.expression;

		let currentValue = 0;
		let currentOperator = "";

		let nodesStack : ExpressionNode[] = [];
		let nodes : ExpressionNode[] = [];
		let currentNode  : any = undefined;

		expressionTree.nodes.map((node) => {

			if (node.nodeType === ExpressionNodeType.numeric && 
				currentExpressionNodeType === ExpressionNodeType.expression) {
				currentValue = node.value;
				currentExpressionNodeType = node.nodeType;

				nodesStack.push(node);
			} else
			if (node.nodeType === ExpressionNodeType.alpha && 
				(currentExpressionNodeType === ExpressionNodeType.expression ||
				 currentExpressionNodeType === ExpressionNodeType.parameters
				)) {
				
				if (node.nodes.length > 0 && expressionFunctions[node.value]) {
					let parameters : any[] = [];
					if (node.nodes.length > 0 && node.nodes[0].nodeType === ExpressionNodeType.parameters) {
						node.nodes[0].nodes.map((currentNode) => {
							let nodes : ExpressionNode = {
								nodes : [currentNode],
								nodeType : ExpressionNodeType.expression,
								value: 0
							}
							parameters.push(ExpressionTreeExecute(nodes, values));
							return true;
						});
						currentValue = expressionFunctions[node.value](...parameters);
					} else {
						let nodes : ExpressionNode = {
							nodes : node.nodes,
							nodeType : ExpressionNodeType.expression,
							value: 0
						}
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
					} 
				} else {
					if (isRangeValue(node.value)) {
						currentValue = node.value;
					} else {
						if (node.value.indexOf(".") > 0) {
							currentValue = 0;
							const splitted = node.value.split('.');
							if (splitted.length == 2) {
								if ((nameSpaceCache as any)[splitted[0]]) {
									currentValue = (nameSpaceCache as any)[splitted[0]][splitted[1]];
								} else {
									const variables = convertGridToNamedVariables(values[splitted[0]]);
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
					value : currentValue,
					nodeType : ExpressionNodeType.numeric,
					nodes : []
				}

				nodesStack.push(newNode);
			} else


			if (node.nodeType === ExpressionNodeType.operator && 
				currentExpressionNodeType === ExpressionNodeType.expression) {
				console.log("unexpected expression node" , expressionTree, nodes, nodesStack, currentNode);
				throw new Error("unexpected expression node");
			} else

			if (
				(node.nodeType === ExpressionNodeType.operator && 
					currentExpressionNodeType === ExpressionNodeType.alpha) ||
				(node.nodeType === ExpressionNodeType.operator && 
					currentExpressionNodeType === ExpressionNodeType.numeric)
				) {

				currentOperator = node.value;
				currentExpressionNodeType = node.nodeType;

				nodesStack.push(node);
			} else

			if (	
					(
						node.nodeType === ExpressionNodeType.numeric ||
						node.nodeType === ExpressionNodeType.alpha
					) && 
					currentExpressionNodeType === ExpressionNodeType.operator
				) {
				
				currentExpressionNodeType = ExpressionNodeType.numeric;
				let valueForExpression = 0;
				if (node.nodeType === ExpressionNodeType.alpha) {
					if (node.nodes.length > 0 && expressionFunctions[node.value]) {

						let nodes : ExpressionNode = {
							nodes : node.nodes,
							nodeType : ExpressionNodeType.expression,
							value: 0
						}
						valueForExpression = expressionFunctions[node.value](								
							ExpressionTreeExecute(nodes, values)
						)
					} else {
						if (isRangeValue(node.value)) {
							throw new Error(`Range ${node.value} not supported for operators`)
						} else {
							valueForExpression = Number(values[node.value]) || 0;
						}
					}
				} else {
					valueForExpression = node.value;
				}

				if (currentOperator === "^" && operator.indexOf(currentOperator) >= 0) {
					currentValue = Math.pow(currentValue , valueForExpression);
					currentNode = {
						nodeType : ExpressionNodeType.numeric,
						value : currentValue,
						nodes : []
					}
					nodesStack.pop();
					nodesStack.pop();

				} else
				if (currentOperator === "+" && operator.indexOf(currentOperator) >= 0) {
					currentValue += valueForExpression;

					currentNode = {
						nodeType : ExpressionNodeType.numeric,
						value : currentValue,
						nodes : []
					}
					nodesStack.pop();
					nodesStack.pop();

				} else
				if (currentOperator === "-" && operator.indexOf(currentOperator) >= 0) {
					currentValue -= valueForExpression;

					currentNode = {
						nodeType : ExpressionNodeType.numeric,
						value : currentValue,
						nodes : []
					}
					nodesStack.pop();
					nodesStack.pop();

				} else 
				if (currentOperator === "*" && operator.indexOf(currentOperator) >= 0) {
					
					currentValue *= valueForExpression;
					
					currentNode = {
						nodeType : ExpressionNodeType.numeric,
						value : currentValue,
						nodes : []
					}
					nodesStack.pop();
					nodesStack.pop();

				} else				
				if (currentOperator === "/" && operator.indexOf(currentOperator) >= 0) {
					currentValue /= valueForExpression;

					currentNode = {
						nodeType : ExpressionNodeType.numeric,
						value : currentValue,
						nodes : []
					}
					nodesStack.pop();
					nodesStack.pop();
		
				} else {

					if (currentNode !== undefined) {
						const operator : ExpressionNode = nodesStack.pop() as ExpressionNode;
						nodesStack.push(currentNode);
						currentNode = undefined;
						nodesStack.push(operator);
					}
					currentValue = node.value;
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
			nodeType: ExpressionNodeType.expression
		};
	}

	return {
		nodes: [],
		nodeType: ExpressionNodeType.expression,
		value: 0
	};
}

function ExpressionTreeExecute(expressionTree: ExpressionNode, values : any) {
		
	if (expressionTree.nodes.length > 0) {

		let nodeList : ExpressionNode[] = expressionTree.nodes.map((node) => {
			if (node.nodeType === ExpressionNodeType.expression && node.nodes.length > 0) {
				let newNode = {
					value : ExpressionTreeExecute(node , values),
					nodeType : ExpressionNodeType.numeric,
					nodes : []
				}
				return newNode;
			}
			return node;
		});

		let nodes : ExpressionNode = {
			nodes : nodeList,
			nodeType : ExpressionNodeType.expression,
			value: 0
		}

		nodes = ExpressionTreeExecuteForOperator(nodes, "^", values);
		nodes = ExpressionTreeExecuteForOperator(nodes, "/*", values);
		nodes = ExpressionTreeExecuteForOperator(nodes, "+-", values);

		if (nodes.nodes.length > 0) {
			return nodes.nodes[0].value;
		}
		return 0;		
	}

	return false;
}

export function executeExpressionTree(expressionTree: ExpressionNode, values : any) {
	nameSpaceCache = {};
	return ExpressionTreeExecute(expressionTree, values);
}

export function extractValueParametersFromExpressionTree(tree : ExpressionNode) : string[] {

	const extractDeeper = () : string[] => {
		let result = tree.nodes.map((node : ExpressionNode) => {
			return [...extractValueParametersFromExpressionTree(node)];
		});
		let parameters : string[] = [];
		result.map((parameter) => {
			parameter.map((parameterName) => {
				parameters.push(parameterName);
				return true;
			});
			return true;
		});
		return parameters;
	}

	if (tree && tree.nodeType === ExpressionNodeType.alpha) {
		if (!isExpressionFunction(tree.value)) {
			return [tree.value];
		} else {
			return extractDeeper();
		}
	} else if (tree && (tree.nodeType === ExpressionNodeType.expression || tree.nodeType === ExpressionNodeType.parameters)) {
		return extractDeeper();
	}
	return [];
}