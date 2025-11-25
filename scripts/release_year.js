var dy_margins = { top: 0, right: 0, bottom: 0, left: 75 };

var dy_width = d3.select("#stats-image-4").node().offsetWidth,
  dy_height = d3.select("#stats-image-4").node().offsetHeight;

// Add sub-title text
var sub_text = d3.select("#stats-4-text").append("h2");

d3.json(
  "data/release_year.json"
  // "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/release-year"
).then(function (response) {
  // console.log(response);
  let data = response.data;

  let years = tidy(
    data["all"],
    arrange("year_num"),
    groupBy("year_num", slice(0, 1))
  );

  // Count number of decades
  var total_decades = [...new Set(data["all"].map((d) => d.decade_num))].length;

  let decades = tidy(
    data["all"],
    arrange("decade_num"),
    groupBy("decade_num", slice(0, 1))
  );

  var dy_rect_width = dy_width / 12,
    dy_rect_height =
      dy_height /
      ([...new Set(data["all"].map((d) => d.decade_num))].length + 2);

  // Add SVG
  var dy_svg = d3
    .select("#stats-image-4")
    .append("svg")
    .attr("id", "dy-svg")
    .attr("viewBox", [0, 0, dy_width, dy_height]);

  // Define textures for years with no albums
  no_albums = textures
    .lines()
    .orientation("vertical", "horizontal")
    .size(4)
    .strokeWidth(1)
    .shapeRendering("crispEdges")
    .background("#ffffff")
    .stroke("#dcf9e6");

  dy_svg.call(no_albums);

  // Add background texture
  dy_svg
    .append("rect")
    .attr("class", "dy-back")
    .attr("x", dy_rect_width)
    .attr("y", dy_rect_height * 2)
    .attr("width", dy_rect_width * 10)
    .attr("height", dy_rect_height * total_decades)
    .attr("fill", no_albums.url());

  // Add decade labels
  dy_svg
    .selectAll("dy-svg")
    .data(decades)
    .enter()
    .append("text")
    .attr("class", "dy-text")
    .attr("x", dy_rect_width - 5)
    .attr("y", (d) => dy_rect_height * 2.5 + d.decade_num * dy_rect_height)
    .text((d) => d.decade + "0's")
    .attr("alignment-baseline", "middle");

  // Legend text
  dy_svg
    .append("text")
    // .attr("class", "dy-text-legend-main")
    .attr("class", "dy-text-legend")
    .attr("x", dy_rect_width)
    .attr("y", dy_rect_height)
    .text("None")
    .attr("alignment-baseline", "hanging");

  var dy_scale_legend = d3.scaleLog().domain([1, 100]);

  var dy_color = d3
    .scaleLinear()
    .domain([0, 0.9, 1])
    .range(["#eeeeee", "#76e99f", "#1db954"])
    .interpolate(d3.interpolateLab)
    .clamp(true);

  // Legend
  var legend_data = [...new d3.range(1, 110, 0.25)];

  var legend_width = dy_rect_width * 5;

  // Add legend rects
  dy_svg
    .selectAll("dy-svg")
    .data(legend_data)
    .enter()
    .append("rect")
    .attr("class", "dy-grid")
    .attr(
      "x",
      (d, i) => dy_rect_width * 2 + (i * legend_width) / legend_data.length
    )
    .attr("y", dy_rect_height / 2)
    .attr("width", legend_width / legend_data.length)
    .attr("height", dy_rect_height / 2)
    .attr("fill", (d) => dy_color(dy_scale_legend(d)));

  // Add legend text
  dy_svg
    .selectAll("dy-svg")
    .data(legend_data)
    .enter()
    .append("text")
    .attr("class", "dy-text-legend")
    .attr(
      "x",
      (d, i) => dy_rect_width * 2 + (i * legend_width) / legend_data.length
    )
    .attr("y", dy_rect_height)
    .text((d) => (d == 1 ? "Less" : d == 98 ? "More" : ""))
    .attr("alignment-baseline", "hanging");

  // Legend: None
  dy_svg
    .append("rect")
    .attr("class", "dy-grid")
    .attr("x", dy_rect_width)
    .attr("y", dy_rect_height / 2)
    .attr("width", dy_rect_width)
    .attr("height", dy_rect_height / 2)
    .attr("fill", no_albums.url())
    .attr("z-index", 10);

  // Add labels for each year
  years_data = release_year_range(data["all"]);

  // Update grid rects based on period selection
  dy_svg
    .selectAll("dy-svg")
    .data(years_data)
    .enter()
    .append("text")
    .attr("class", "dy-grid-label")
    .attr(
      "x",
      (d) => dy_rect_width + dy_rect_width * d.year_num + dy_rect_width / 2
    )
    .attr("y", (d) => dy_rect_height * 2.5 + dy_rect_height * d.decade_num)
    .text((d) => d.decade + d.year_num);

  function draw_period(period) {
    d3.selectAll("#year-color").remove();

    var num_years = data[period].length,
      num_decades = [...new Set(data[period].map((d) => d.decade_num))].length;

    d3.select("#stats-4-text.h2").remove();

    var dy_sub_heading =
      period === "all"
        ? "I've listened to albums from " +
          num_years +
          " years spread across " +
          num_decades +
          " decades"
        : period === "year"
        ? "Over the past year, I've listened to albums from " +
          num_years +
          " years spread across " +
          num_decades +
          " decades"
        : period === "month"
        ? "Over the past month, I've listened to albums from " +
          num_years +
          " years spread across " +
          num_decades +
          " decades"
        : "Over the past week, I've listened to albums from " +
          num_years +
          " years spread across " +
          num_decades +
          " decades";

    var dy_sub_heading =
      "I've listened to albums from " +
      num_years +
      " years spread across " +
      num_decades +
      " decades. \
    I've listened to at least 1 album each year since the 1956. \
    Most of the albums I've listened to have been released since 2020. Some of this is due \
    to it being easier to discover recent album releases on Spotify. This has changed over time though, \
    and I am now listening to more albums from older years as a result of my listening habits changing.";

    sub_text.html(dy_sub_heading);

    var dy_scale = d3
      .scaleLog()
      .domain(d3.extent(data[period], (d) => +d.year_total));

    // Update grid rects based on period selection
    dy_svg
      .selectAll("dy-svg")
      .data(data[period])
      .enter()
      .append("rect")
      .attr("class", "dy-grid")
      .attr("id", "year-color")
      .attr("x", (d) => dy_rect_width + dy_rect_width * d.year_num)
      .attr("y", (d) => dy_rect_height * 2 + dy_rect_height * d.decade_num)
      .attr("width", dy_rect_width)
      .attr("height", dy_rect_height)
      .attr("fill", (d) => dy_color(dy_scale(d.year_total)))
      .text((d) => d.decade_num + " " + d.year_num);

    // Draw lines to create grids
    dy_svg
      .selectAll("dy-svg")
      .data(years)
      .enter()
      .append("line")
      .attr("class", "dy-line")
      .attr("x1", (d) => dy_rect_width + d.year_num * dy_rect_width)
      .attr("x2", (d) => dy_rect_width + d.year_num * dy_rect_width)
      .attr("y1", dy_rect_height * 2 - 10)
      .attr("y2", dy_rect_height * 2 + dy_rect_height * total_decades + 10);

    dy_svg
      .selectAll("dy-svg")
      .data(decades)
      .enter()
      .append("line")
      .attr("class", "dy-line")
      .attr("x1", dy_rect_width - 10)
      .attr("x2", dy_rect_width * 11)
      .attr("y1", (d) => dy_rect_height * 2 + d.decade_num * dy_rect_height)
      .attr("y2", (d) => dy_rect_height * 2 + d.decade_num * dy_rect_height);
  }

  draw_period("all");

  d3.selectAll('input[name="listen-period"]').on("change", function () {
    if (this.checked) {
      draw_period(this.value);
    }
  });

  // // Remove loading screen
  // setTimeout(() => {
  //   d3.select(".loader").node().classList.add("hidden");
  // }, 1000);
});
