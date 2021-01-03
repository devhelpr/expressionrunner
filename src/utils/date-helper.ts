export function JustADate(initDate?: any) {
  // thanks to https://stackoverflow.com/questions/2698725/comparing-date-part-only-without-comparing-time-in-javascript

  let utcMidnightDateObj: any = null;

  // if no date supplied, use Now.
  if (!initDate) {
    initDate = new Date();
  }

  // if initDate specifies a timezone offset, or is already UTC, just keep the date part, reflecting the date _in that timezone_
  if (
    typeof initDate === 'string' &&
    initDate.match(/((\+|-)\d{2}:\d{2}|Z)$/gm)
  ) {
    utcMidnightDateObj = new Date(initDate.substring(0, 10) + 'T00:00:00Z');
  } else {
    // if init date is not already a date object, feed it to the date constructor.
    if (!(initDate instanceof Date)) {
      initDate = new Date(initDate);
    }
    // Vital Step! Strip time part. Create UTC midnight dateObj according to local timezone.
    utcMidnightDateObj = new Date(
      Date.UTC(initDate.getFullYear(), initDate.getMonth(), initDate.getDate())
    );
  }

  return {
    getDateObject: () => utcMidnightDateObj,
    toISOString: () => utcMidnightDateObj.toISOString(),
    getUTCDate: () => utcMidnightDateObj.getUTCDate(),
    getUTCDay: () => utcMidnightDateObj.getUTCDay(),
    getUTCFullYear: () => utcMidnightDateObj.getUTCFullYear(),
    getUTCMonth: () => utcMidnightDateObj.getUTCMonth(),
    setUTCDate: (arg: any) => utcMidnightDateObj.setUTCDate(arg),
    setUTCFullYear: (arg: any) => utcMidnightDateObj.setUTCFullYear(arg),
    setUTCMonth: (arg: any) => utcMidnightDateObj.setUTCMonth(arg),
    addDays: (days: any) => {
      utcMidnightDateObj.setUTCDate(utcMidnightDateObj.getUTCDate() + days);
    },
    addMonths: (months: any) => {
      utcMidnightDateObj.setUTCMonth(utcMidnightDateObj.getUTCMonth() + months);
    },
    addYears: (years: any) => {
      utcMidnightDateObj.setUTCFullYear(
        utcMidnightDateObj.getUTCFullYear() + years
      );
    },
    toString: () => utcMidnightDateObj.toString(),
    toLocaleDateString: (locale: string, options: any) => {
      options = options || {};
      options.timeZone = 'UTC';
      locale = locale || 'en-EN';
      return utcMidnightDateObj.toLocaleDateString(locale, options);
    },
    diffYears: (diffDate: any) => {
      const milliseconds = utcMidnightDateObj - diffDate.getDateObject();
      var ageDate = new Date(milliseconds);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    },
  };
}
