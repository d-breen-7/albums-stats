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
      cumulativeSum += row.day_albums;
      const newRow = { ...row, cum_sum: cumulativeSum };
      result.push(newRow);
    });
  }

  return result;
}

function getOccurrence(array, value) {
  return array.filter((v) => v === value).length;
}

function wrap(text, width) {
  text.each(function () {
    let text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1, // ems
      x = text.attr("x"),
      y = text.attr("y"),
      dy = 1,
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", x)
        .attr("y", y)
        .attr("letter-spacing", 1)
        .attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("letter-spacing", 1)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}

function ms_to_hour_min(duration) {
  let seconds = Math.ceil(duration / 1000);
  let minutes = Math.ceil(seconds / 60);
  let hours = Math.floor(minutes / 60);

  return [hours, minutes % 60];
}

function days_in_year(year) {
  return leap_year(year) ? 366 : 365;
}

function leap_year(year) {
  return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
}

const sequence = (min, max, step) =>
  Array.from({ length: (max - min + 1) / step + 1 }, (_, i) => min + i * step);

function scale_x_history(year, margin_left, width) {
  let mindate = new Date(+year, 0, 1),
    maxdate = new Date(+year + 1, 0, 0);
  return d3.scaleTime().domain([mindate, maxdate]).range([margin_left, width]);
}

function scale_y_history(max, height, margin_top) {
  return d3.scaleLinear().domain([0, max]).range([height, margin_top]);
}

function scale_h_history(max, height) {
  return d3.scaleLinear().domain([0, max]).range([0, height]);
}

function last_listen_days(last_listen) {
  let today = new Date();
  let today_UTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let last_UTC = Date.UTC(
    last_listen.getFullYear(),
    last_listen.getMonth(),
    last_listen.getDate()
  );

  let gap = Math.floor(today_UTC - last_UTC) / (1000 * 3600 * 24);
  return gap;
}

function album_cy(plays_data, album_id, date) {
  row_index = tidy(
    plays_data,
    filter((d) => d.listen_date === date),
    arrange("play_code"),
    distinct(["album_id", "listen_date"]),
    mutateWithSummary({
      album_y: rowNumber(),
    })
  );

  let y = row_index
    .filter((d) => d.album_id === album_id)
    .map((d) => d.album_y)[0];

  return y + 1;
}

function overview_stats(overview, all_years) {
  all_years
    .map((d) => d.year)
    .forEach((year, index) => {
      let year_data = overview.filter((d) => d.year === year),
        year_selector = "#history-" + year;

      let year_summary = tidy(
        year_data,
        summarize({
          total: sum("albums"),
          max: max("albums"),
          days: tally("albums"),
        })
      )[0];

      let daily_average = (year_summary.total / year_summary.days[0].n).toFixed(
        1
      );

      let max_times = tidy(
        year_data,
        filter((d) => d.albums === year_summary.max)
      ).length;

      let max_info =
        max_times > 1
          ? Math.floor(year_summary.max) + " (x" + max_times + ")"
          : Math.floor(year_summary.max);

      let zero_days = tidy(
        year_data,
        filter((d) => d.albums === 0)
      ).length;

      d3.select(year_selector)
        .select("#history-stats-1")
        .text(Number(year_summary.total).toLocaleString());

      d3.select(year_selector).select("#history-stats-2").text(daily_average);

      d3.select(year_selector).select("#history-stats-3").text(max_info);

      d3.select(year_selector).select("#history-stats-4").text(zero_days);
    });
}

function album_slider(selector, data) {
  // s = selector + ".history-albums-container";
  d3.select(selector)
    // .select(".history-albums-container")
    // // .select(".history-albums-container")
    .append("div")
    .attr("class", "history-albums");

  d3.select(selector)
    .select(".history-albums")
    .selectAll("div")
    .data(data)
    .enter()
    .append("div")
    .attr("class", "history-slide-details");

  d3.select(selector)
    .selectAll(".history-slide-details")
    .append("div")
    .attr("class", "history-slide-name")
    .text((d) =>
      d.album_name.length > 30
        ? d.album_name.substring(0, 27) + " ..."
        : d.album_name
    );

  d3.select(selector)
    .selectAll(".history-slide-details")
    .append("div")
    .append("a")
    .attr("href", (d) => d.album_url)
    .append("div")
    .attr("class", "history-slide-cover")
    .append("img")
    .attr("src", (d) => d.album_cover)
    .attr("height", 150)
    .attr("width", 150);
}

var release_texture_legend = textures
  .lines()
  .stroke("#76e99f")
  .background("#1db954")
  .thicker();

function draw_artist_legend() {
  // Data for artist legend
  const legendData = [
    { className: "album-play-0", text: "First listen", cy: 30 },
    { className: "album-play-1", text: "New listen", cy: 60 },
    { className: "album-play-2", text: "Relisten", cy: 90 },
    { className: "album-play-5", text: "Feat. on album", cy: 120 },
  ];

  // Create SVG
  const legend_svg = d3
    .select("#album-info-legend")
    .append("svg")
    .attr("id", "album-info-legend-svg")
    .attr("width", "100%")
    .attr("height", "100%");

  // Add circles
  legend_svg
    .selectAll(".album-type-legend")
    .data(legendData)
    .enter()
    .append("circle")
    .attr("class", (d) => `${d.className} ablum-type-legend`)
    .attr("cx", 40)
    .attr("cy", (d) => d.cy)
    .attr("r", 10);

  // Add text labels
  legend_svg
    .selectAll(".legend-text.dynamic")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 60)
    .attr("y", (d) => d.cy + 5)
    .text((d) => d.text)
    .attr("class", "legend-text dynamic");

  legend_svg.call(release_texture_legend);

  legend_svg
    .append("rect")
    .attr("x", 160)
    .attr("y", 20)
    .attr("width", 5)
    .attr("height", 80)
    // .attr("class", "album-release")
    .style("fill", release_texture_legend.url());

  legend_svg
    .append("text")
    .attr("x", 170)
    .attr("y", 35)
    .text("Album release")
    .attr("class", "legend-text");
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

const sumByYear = (dataset, yearToFilter) => {
  return dataset
    .filter((d) => d.listen_year === yearToFilter)
    .reduce((total, currentItem) => {
      const rowSum = Object.entries(currentItem).reduce((acc, [key, value]) => {
        if (key.startsWith("d")) {
          const decadeYear = Number(key.replace("d", ""));

          if (!isNaN(decadeYear) && decadeYear <= 2000) {
            return acc + (value || 0);
          }
        }
        return acc;
      }, 0);

      return total + rowSum;
    }, 0);
};
