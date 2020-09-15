export function getRangeFromValues(
  values: any,
  rangeSpecification: string
): any[] {
  let result: any[] = [];
  const splitted = rangeSpecification.split(':');
  if (splitted.length > 0) {
    if (splitted.length === 2) {
      const minRange = splitted[0].split(/(\d+)/);
      const maxRange = splitted[1].split(/(\d+)/);

      if (minRange.length >= 2 && maxRange.length >= 2) {
        let loop = parseInt(minRange[1], 10) - 1;
        const max = parseInt(maxRange[1], 10) - 1;

        while (loop <= max) {
          let loopCell = (minRange[0] || 'A').charCodeAt(0) - 65;
          const maxCell = (maxRange[0] || 'A').charCodeAt(0) - 65;

          while (loopCell <= maxCell) {
            if (loop < values.length && loopCell < values[loop].length) {
              const cellValue = values[loop][loopCell];
              result.push(Number(cellValue) || 0);
            }

            loopCell++;
          }
          loop++;
        }
      }
    }
  }
  return result;
}

export function isRangeValue(valueParameter: string) {
  return valueParameter.toString().indexOf(':') >= 0;
}

export function getRangeValueParameters(valueParameter: string): string[] {
  if (isRangeValue(valueParameter)) {
    let result: any[] = [];
    const splitted = valueParameter.split(':');
    if (splitted.length > 0) {
      if (splitted.length === 2) {
        const minRange = splitted[0].split(/(\d+)/);
        const maxRange = splitted[1].split(/(\d+)/);

        if (minRange.length >= 2 && maxRange.length >= 2) {
          let loop = parseInt(minRange[1], 10) - 1;
          const max = parseInt(maxRange[1], 10) - 1;

          while (loop <= max) {
            let loopCell = (minRange[0] || 'A').charCodeAt(0) - 65;
            const maxCell = (maxRange[0] || 'A').charCodeAt(0) - 65;

            while (loopCell <= maxCell) {
              result.push((loopCell + 65).toString() + (loop + 1).toString());

              loopCell++;
            }
            loop++;
          }
        }
      }
    }
    return result;
  }
  return [];
}

export const convertGridToNamedVariables = (values: any[]) => {
  let variables: any = {};
  values.map((rowValues, rowIndex) => {
    if (rowValues) {
      rowValues.map((cellValue: string, columnIndex: number) => {
        if (cellValue) {
          /*
						TODO:
					
							- check if cell contains reference to namespace (contains a dot)
							- if so... get the data from the namespace
					
					*/

          if (cellValue === '' || (cellValue !== '' && cellValue[0] !== '=')) {
            let letter = String.fromCharCode((columnIndex % 26) + 65);
            let value = Number(cellValue) || 0;
            /*
						if (isNaN(value)) {
							value = cellValue;
						}
						*/
            variables[letter + (rowIndex + 1)] = value;
          }
        }
        return true;
      });
    }
    return true;
  });
  return variables;
};
