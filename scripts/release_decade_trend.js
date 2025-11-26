var dy_margins = { top: 0, right: 0, bottom: 0, left: 75 };

var dy_width = d3.select("#stats-image-5").node().offsetWidth,
  dy_height = d3.select("#stats-image-5").node().offsetHeight;

var sub_text = d3.select("#stats-5-text").append("h2");

var dy_sub_heading =
  "A breakdown of the release decade of albums during each listen year to show the proportion <span style='color: #ffffff; font-weight: 1000; background-color: #1db954;border-radius: 5px;'>released pre-2010</span> \
  and <span style='color: #191414; font-weight: 1000; background-color: #9df7bd;border-radius: 5px;'> released 2010 onwards</span>.\
  The proportion released pre-2010 has been increasing over time as I explore older music. Some of this is increase can also be explained by \
  the reduction in album listens over time.";

sub_text.html(dy_sub_heading);

// d3.json(
//   // "data/release_year.json"
//   "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/release-year"
// ).then(function (response) {
//   // let data = decade_breakdown(response.data["all"]);

const data = [
  {
    listen_year: 2020,
    d1950: 0,
    d1960: 0,
    d1970: 0,
    d1980: 0.051,
    d1990: 0.758,
    d2000: 6.515,
    d2010: 56.465,
    d2020: 36.212,
  },
  {
    listen_year: 2021,
    d1950: 0,
    d1960: 0.047,
    d1970: 0.142,
    d1980: 0.189,
    d1990: 2.459,
    d2000: 7.896,
    d2010: 37.967,
    d2020: 51.3,
  },
  {
    listen_year: 2022,
    d1950: 0.064,
    d1960: 0.318,
    d1970: 0.318,
    d1980: 1.462,
    d1990: 5.404,
    d2000: 12.842,
    d2010: 35.728,
    d2020: 43.865,
  },
  {
    listen_year: 2023,
    d1950: 0,
    d1960: 1.022,
    d1970: 1.789,
    d1980: 2.875,
    d1990: 6.581,
    d2000: 11.693,
    d2010: 22.62,
    d2020: 53.419,
  },
  {
    listen_year: 2024,
    d1950: 0.148,
    d1960: 1.108,
    d1970: 3.767,
    d1980: 6.721,
    d1990: 15.288,
    d2000: 15.583,
    d2010: 20.384,
    d2020: 37.001,
  },
  {
    listen_year: 2025,
    d1950: 0.111,
    d1960: 1.332,
    d1970: 4.661,
    d1980: 6.77,
    d1990: 11.21,
    d2000: 13.43,
    d2010: 20.866,
    d2020: 41.62,
  },
];

const decades = [
  "",
  "1950",
  "1960",
  "1970",
  "1980",
  "1990",
  "2000",
  "2010",
  "2020",
];

// Create tiles for each listen year
const dashboard = d3.select("#stats-image-5");

data.forEach((yearData, index) => {
  const tile = dashboard
    .append("div")
    .attr("class", "rd-tile")
    .attr("id", "rd-tile-" + index);

  // Define layout dimensions
  var tile_width = d3.select("#rd-tile-0").node().offsetWidth;
  var bar_start_x = 50;
  var bar_width = tile_width - tile_width * 0.1 - bar_start_x;
  var row_height = 30;

  tile.append("div").attr("class", "rd-title").text(yearData.listen_year);

  const svgHeight = decades.length * row_height + row_height + 5;

  const svg = tile
    .append("svg")
    .attr("width", tile_width)
    .attr("height", svgHeight);

  // Calculate total listens
  let preTotal = 0;
  let postTotal = 0;

  Object.keys(yearData).forEach((key) => {
    if (key.startsWith("d")) {
      const decade = Number(key.slice(1)); // extract the number e.g. "d2010" -> 2010

      if (decade < 2010) {
        preTotal += yearData[key];
      } else {
        postTotal += yearData[key];
      }
    }
  });

  // Add decade backgrounds and labels
  decades.forEach((decade, i) => {
    const y = i * row_height + 20;

    // Decade background
    svg
      .append("rect")
      .attr("class", "rd-bar-bg")
      .attr("x", bar_start_x)
      .attr("y", y + 4)
      .attr("width", bar_width)
      .attr("height", row_height - 8);

    svg
      .append("text")
      .attr("class", "rd-decade-label")
      .attr("x", bar_start_x - 10)
      .attr("y", y + row_height / 2 + 4)
      .attr("text-anchor", "end")
      .attr("fill", decade == "" ? "#191414" : "#a9a9a9")
      .attr("font-weight", decade == "" ? "bolder" : "normal")
      .text(decade == "" ? "Overall" : decade + "s");
  });

  // Vertical grid lines
  const gridPercents = d3.range(0, 120, 20);

  gridPercents.forEach((p) => {
    const x = bar_start_x + (p / 100) * bar_width;

    svg
      .append("line")
      .attr("class", "rd-gridline")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", 25)
      .attr("y2", decades.length * row_height + 20);
  });

  // Add labels
  gridPercents.forEach((p) => {
    const x = bar_start_x + (p / 100) * bar_width;

    svg
      .append("text")
      .attr("class", "rd-grid-label")
      .attr("x", x)
      .attr("y", svgHeight - 5)
      .attr("text-anchor", "middle")
      .text(p + "%");
  });
  // }

  // Add data bars
  let cumulative = 0;

  decades.forEach((decade, i) => {
    const value = yearData["d" + decade];
    const y = i * row_height + 20;

    if (decade === "") {
      const bar_widthPre = (preTotal / 100) * bar_width;
      const bar_widthPost = (postTotal / 100) * bar_width;

      // Pre-2010 total bar
      svg
        .append("rect")
        .attr("class", "rd-bar rd-bar-comp")
        .attr("x", bar_start_x)
        .attr("y", y + 4)
        .attr("width", bar_widthPre)
        .attr("height", row_height - 8)
        .attr("fill", "#1db954");

      // Post-2010 total bar
      svg
        .append("rect")
        .attr("class", "rd-bar rd-bar-comp")
        .attr("x", bar_start_x + bar_widthPre)
        .attr("y", y + 4)
        .attr("width", bar_widthPost)
        .attr("height", row_height - 8)
        .attr("fill", "#9df7bd");

      svg
        .append("text")
        .attr("class", "rd-comp-label")
        .attr("x", bar_start_x)
        .attr("y", row_height - 12)
        .attr("text-anchor", "start")
        .attr("fill", "#1db954")
        .text(Number(preTotal).toFixed(1) + "%");

      svg
        .append("text")
        .attr("class", "rd-comp-label")
        .attr("x", bar_start_x + bar_width)
        .attr("y", row_height - 12)
        .attr("text-anchor", "end")
        .attr("fill", "#a9a9a9")
        .text(Number(postTotal).toFixed(1) + "%");
    }

    if (value > 0) {
      const barX = bar_start_x + (cumulative / 100) * bar_width;
      const bar_width_ = (value / 100) * bar_width;

      // Color based on
      svg
        .append("rect")
        .attr("class", "rd-bar")
        .attr("x", barX)
        .attr("y", y + 4)
        .attr("width", bar_width_)
        .attr("height", row_height - 8)
        .attr("fill", decade.slice(0, 3) > 200 ? "#9df7bd" : "#1db954");

      cumulative += value;
    }
  });
});
