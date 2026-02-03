var release_margins = { top: 0, right: 0, bottom: 0, left: 75 };

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/release-year",
).then(function (response) {
  var data = response.data;

  // Define years in a decade 0 - 9
  let years = Array.from({ length: 10 }, (_, i) => ({ year_num: String(i) }));

  // Count number of decades
  var total_decades = [...new Set(data["all"].map((d) => d.decade_num))].length;

  let decades = tidy(
    data["all"],
    arrange("decade_num"),
    groupBy("decade_num", slice(0, 1)),
  );

  var release_width = d3.select("#release-image").node().offsetWidth,
    release_height = d3.select("#release-image").node().offsetHeight,
    release_rect_width = release_width / 12,
    release_rect_height = release_height / (total_decades + 3);

  // Add sub-title text
  var sub_text = d3.select("#release-text").append("h2");

  // Add SVG
  var release_svg = d3
    .select("#release-image")
    .append("svg")
    .attr("id", "release-svg")
    .attr("width", release_width)
    .attr("height", release_height);

  // Define textures for years with no albums
  no_albums = textures
    .lines()
    .orientation("vertical", "horizontal")
    .size(4)
    .strokeWidth(1)
    .shapeRendering("crispEdges")
    .background("#ffffff")
    .stroke("#dcf9e6");

  release_svg.call(no_albums);

  // Add background texture
  release_svg
    .append("rect")
    .attr("class", "release-background")
    .attr("x", release_rect_width)
    .attr("y", release_rect_height * 2)
    .attr("width", release_rect_width * 10)
    .attr("height", release_rect_height * total_decades)
    .attr("fill", no_albums.url());

  // Add decade labels
  release_svg
    .selectAll("release-svg")
    .data(decades)
    .enter()
    .append("text")
    .attr("class", "release-text-leg")
    .attr("x", release_rect_width - 5)
    .attr(
      "y",
      (d) => release_rect_height * 2.5 + d.decade_num * release_rect_height,
    )
    .text((d) => d.decade + "0s")
    .attr("alignment-baseline", "middle");

  // Legend text
  release_svg
    .append("text")
    .attr("class", "release-legend-text")
    .attr("x", release_rect_width)
    .attr("y", release_rect_height + 2)
    .text("None")
    .attr("alignment-baseline", "hanging");

  var release_scale_legend = d3.scaleLog().domain([1, 500]);

  var release_color = d3
    .scaleLinear()
    .domain([0, 0.9, 1])
    .range(["#eeeeee", "#76e99f", "#1db954"])
    .interpolate(d3.interpolateLab)
    .clamp(true);

  // Legend
  var legend_data = [...new d3.range(1, 500, 5)];

  var legend_width = release_rect_width * 5;

  // Add legend text
  release_svg
    .selectAll("release-svg")
    .data(legend_data)
    .enter()
    .append("text")
    .attr("class", "release-legend-text")
    .attr(
      "x",
      (d, i) =>
        release_rect_width * 2 + (i * legend_width) / legend_data.length,
    )
    .attr("y", release_rect_height + 2)
    .text((d) => (d == 1 ? "Less albums" : d == 451 ? "More" : ""))
    .attr("alignment-baseline", "hanging");

  // Legend: None
  release_svg
    .append("rect")
    .attr("class", "release-grid-legend")
    .attr("x", release_rect_width)
    .attr("y", release_rect_height / 2)
    .attr("width", 45)
    .attr("height", release_rect_height / 2)
    .attr("fill", no_albums.url())
    .attr("z-index", 10);

  // Add legend rects
  release_svg
    .selectAll("release-svg")
    .data(legend_data)
    .enter()
    .append("rect")
    .attr("class", "release-grid")
    .attr(
      "x",
      (d, i) =>
        release_rect_width * 2 + (i * legend_width - 0.1) / legend_data.length,
    )
    .attr("y", release_rect_height / 2)
    .attr("width", legend_width / legend_data.length)
    .attr("height", release_rect_height / 2)
    .attr("fill", (d) => release_color(release_scale_legend(d)))
    .attr("stroke", (d) => release_color(release_scale_legend(d)));

  // Add labels for each year
  years_data = release_year_range(data["all"]);

  release_svg
    .selectAll("release-svg")
    .data(years_data)
    .enter()
    .append("text")
    .attr("class", "release-grid-label")
    .attr(
      "x",
      (d) =>
        release_rect_width +
        release_rect_width * d.year_num +
        release_rect_width / 2,
    )
    .attr(
      "y",
      (d) => release_rect_height * 2.5 + release_rect_height * d.decade_num,
    )
    .text((d) => d.decade + d.year_num);

  // Update grid rects based on period selection
  function draw_period(period) {
    d3.selectAll("[id^='rect-year-']").remove();
    d3.selectAll(".release-grid-tooltip").remove();
    d3.select("#release-text.h2").remove();

    var num_years = data[period].length,
      num_decades = [...new Set(data[period].map((d) => d.decade_num))].length;

    let overview_text = `<span style='color: #1db954; font-weight: 1000'>${num_years}</span> years spread across <span style='color: #1db954; font-weight: 1000'>${num_decades}</span> decades`,
      tooltip_note = `<br><span style='color: #a9a9a9'>Hover over a year to see the number of albums</span>`;

    var release_text_desc =
      period === "all"
        ? `Since the start of 2019, I've listened to albums from ${overview_text}.${tooltip_note}`
        : period === "year"
          ? `Over the past year, I've listened to albums from ${overview_text}.${tooltip_note}`
          : period === "month"
            ? `Over the past month, I've listened to albums from ${overview_text}.${tooltip_note}`
            : `Over the past week, I've listened to albums from ${overview_text}.${tooltip_note}`;

    sub_text.html(release_text_desc);

    var release_y = d3
      .scaleLog()
      .domain(d3.extent(data[period], (d) => +d.year_total));

    // Update grid rects based on period selection
    let year_rects = release_svg
      .selectAll("release-svg")
      .data(data[period])
      .enter()
      .append("rect")
      .attr("class", "release-grid")
      .attr("id", (d) => `rect-year-${d.decade}${d.year_num}`)
      .attr("x", (d) => release_rect_width + release_rect_width * d.year_num)
      .attr(
        "y",
        (d) => release_rect_height * 2 + release_rect_height * d.decade_num,
      )
      .attr("width", release_rect_width)
      .attr("height", release_rect_height)
      .attr("fill", (d) => release_color(release_y(d.year_total)))
      .text((d) => d.decade_num + " " + d.year_num);

    // Draw lines to create grids
    // Last to account for overlay / z-order
    // Vertical grid lines
    release_svg
      .selectAll("release-svg")
      .data(years)
      .enter()
      .append("line")
      .attr("class", "release-line")
      .attr("x1", (d) => release_rect_width + d.year_num * release_rect_width)
      .attr("x2", (d) => release_rect_width + d.year_num * release_rect_width)
      .attr("y1", release_rect_height * 2 - 10)
      .attr(
        "y2",
        release_rect_height * 2 + release_rect_height * total_decades + 10,
      );

    // Horizontal grid lines
    release_svg
      .selectAll("release-svg")
      .data(decades)
      .enter()
      .append("line")
      .attr("class", "release-line")
      .attr("x1", release_rect_width - 10)
      .attr("x2", release_rect_width * 11)
      .attr(
        "y1",
        (d) => release_rect_height * 2 + d.decade_num * release_rect_height,
      )
      .attr(
        "y2",
        (d) => release_rect_height * 2 + d.decade_num * release_rect_height,
      );

    // Add count for each release year
    release_svg
      .selectAll("release-svg")
      .data(data[period])
      .enter()
      .append("text")
      .attr("class", "release-grid-tooltip")
      .attr("id", (d) => `text-${d.decade}${d.year_num}`)
      .attr(
        "x",
        (d) =>
          release_rect_width +
          release_rect_width * d.year_num +
          release_rect_width / 2,
      )
      .attr(
        "y",
        (d) => release_rect_height * 2.5 + release_rect_height * d.decade_num,
      )
      .text((d) => Number(d.year_total).toLocaleString())
      .style("visibility", "hidden");

    year_rects
      .on("mouseover", function (d) {
        d3.select(`#text-${d.decade}${d.year_num}`).style(
          "visibility",
          "visible",
        );
      })
      .on("mouseout", function (d) {
        d3.select(`#text-${d.decade}${d.year_num}`)
          .transition()
          .delay(10000)
          .style("visibility", "hidden");
      });
  }

  draw_period("all");

  d3.selectAll('input[name="listen-period"]').on("change", function () {
    if (this.checked) {
      draw_period(this.value);
    }
  });

  hideLoader("release-year");
});
