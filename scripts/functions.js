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

function decade_breakdown(rawData) {
  const listenYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026]; // adjust if needed

  // Define decades you care about
  const decades = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

  // Group by listen_year
  const groupedByYear = {};
  rawData.forEach((item) => {
    const ly = Number(item.listen_year);
    if (!groupedByYear[ly]) groupedByYear[ly] = [];
    groupedByYear[ly].push(item);
  });

  // Compute percentages per decade
  const result = listenYears.map((ly) => {
    const rows = groupedByYear[ly] || [];

    // Initialize decade totals
    const decadeTotals = {};
    decades.forEach((d) => (decadeTotals[d] = 0));

    // Rollup by decade
    rows.forEach((r) => {
      const year = Number(r.year);
      const val = Number(r.year_total) || 0;
      const decade = Math.floor(year / 10) * 10; // e.g., 1983 → 1980
      if (decades.includes(decade)) {
        decadeTotals[decade] += val;
      }
    });

    // Sum for this listen_year
    const total = Object.values(decadeTotals).reduce((a, b) => a + b, 0);

    // Convert to percentage
    const percentages = {};
    decades.forEach((d) => {
      percentages[d] = total
        ? Number(((decadeTotals[d] / total) * 100).toFixed(3))
        : 0;
    });

    return {
      listen_year: ly,
      ...percentages,
    };
  });

  return result;
}
