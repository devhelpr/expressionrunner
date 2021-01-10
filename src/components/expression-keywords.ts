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
  'date.compare',
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
  } else if (name === 'date.compare') {
    console.log('date.compare', args.length, args);
    if (args.length >= 2) {
      let date1 = JustADate(new Date(args[0])).toISOString();
      let date2 = JustADate(new Date(args[1])).toISOString();
      console.log(
        'date.compare',
        date1,
        date2,
        date1 === date2,
        date1 < date2,
        date1 > date2
      );
      if (date1 === date2) {
        return 0;
      } else if (date1 < date2) {
        return -1;
      } else {
        return 1;
      }
    }
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
