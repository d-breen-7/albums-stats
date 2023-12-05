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
