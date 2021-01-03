import { JustADate } from '../utils/date-helper';

/*
	concept:
	
		getKeyword and getFunction should return an ExpressionNode

		this way the data type can be influenced

		we need new ExpressionNodeType's : date .. and boolean?

		both can return false as well
*/

export const getKeyword = (name: string) => {
  if (name === 'true') {
    return true;
  }
  return false;
};

const keywordFunctions = [
  'date.now',
  'date',
  'date.addDays',
  'date.addMonths',
  'date.addYears',
  'date.diffYears',
];

export const doesKeywordFunctionExist = (name: string) => {
  if (keywordFunctions.indexOf(name) >= 0) {
    return true;
  }
  return false;
};

export const getFunction = (name: string, ...args: any[]) => {
  if (name === 'date.now') {
    let dateNow = JustADate(new Date());
    return dateNow.toISOString();
  } else if (name === 'date' && args.length > 0) {
    let dateCreated = JustADate(args[0]);
    return dateCreated.toISOString();
  } else if (name === 'date.addDays' && args.length > 1) {
    let dateCreated = JustADate(args[0]);
    dateCreated.addDays(args[1]);
    return dateCreated.toISOString();
  } else if (name === 'date.addMonths' && args.length > 1) {
    let dateCreated = JustADate(args[0]);
    dateCreated.addMonths(args[1]);
    return dateCreated.toISOString();
  } else if (name === 'date.addYears' && args.length > 1) {
    let dateCreated = JustADate(args[0]);
    dateCreated.addYears(args[1]);
    return dateCreated.toISOString();
  } else if (name === 'date.diffYears' && args.length > 1) {
    let dateCreated = JustADate(args[0]);
    let dateDiff = JustADate(args[1]);
    let result = dateCreated.diffYears(dateDiff);
    return result;
  }
  return false;
};
