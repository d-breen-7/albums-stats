const {
  tidy,
  mutate,
  arrange,
  desc,
  summarize,
  groupBy,
  map,
  sum,
  mean,
  filter,
  min,
  max,
  count,
  slice,
  distinct,
  select,
  leftJoin,
  innerJoin,
  tally,
  mutateWithSummary,
  rowNumber,
  sliceHead,
  unnest,
} = Tidy;

function group_by_year(data) {
  var groupedData = {};

  // Group data by year
  data.forEach((row) => {
    const year = row.year;
    if (!groupedData[year]) {
      groupedData[year] = [];
    }
    groupedData[year].push(row);
  });

  var result = [];

  // Calculate the cumulative sum for year
  for (const year in groupedData) {
    let cumulativeSum = 0;
    groupedData[year].forEach((row) => {
      cumulativeSum += row.day_count_all;
      const newRow = { ...row, cum_sum: cumulativeSum };
      result.push(newRow);
    });
  }

  return result;
}

function release_year_range(rawData) {
  // Map each decade -> decade_num from input
  const decadeNumMap = {};
  for (const item of rawData) {
    if (!(item.decade in decadeNumMap)) {
      decadeNumMap[item.decade] = item.decade_num;
    }
  }

  // Get sorted list of decades from input
  const decadesInInput = [...new Set(rawData.map((d) => d.decade))].sort();

  const result = [];

  for (const decade of decadesInInput) {
    const decade_num = decadeNumMap[decade];

    // Full decade: 0–9
    const startYear = parseInt(decade) * 10;
    const endYear = startYear + 9;

    for (let y = startYear; y <= endYear; y++) {
      const year_num = String(y % 10);

      result.push({
        decade,
        year_num,
        year: y,
        decade_num,
      });
    }
  }

  return result;
}
