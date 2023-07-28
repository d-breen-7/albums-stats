var ca_margins = { top: 20, right: 55, bottom: 25, left: 10 };

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/albums"
).then(function (response) {
  var data = tidy(
    response.data,
    mutate({
      day: (d) => d3.timeParse("%Y-%m-%d")(d.date).getDate(),
      month: (d) => d3.timeParse("%Y-%m-%d")(d.date).getMonth(),
    })
  );

  var unique_albums = Number(response.unique).toLocaleString(),
    total_albums = Number(d3.max(data, (d) => d.total_all)).toLocaleString();

  d3.select("#stats-1-text")
    .append("h2")
    .html(
      "I've listened to " +
        unique_albums +
        " unique albums, " +
        total_albums +
        " when including relistens"
    );

  var ca_width = d3.select("#stats-image-1").node().offsetWidth,
    ca_height = d3.select("#stats-image-1").node().offsetHeight;

  // Add X axis
  var ca_x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d3.timeParse("%Y-%m-%d")(d.date)))
    .range([ca_margins.left, ca_width - ca_margins.right]);

  var ca_x_axis = d3.axisBottom(ca_x);

  // Add Y axis
  var ca_y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d.total_all + 5)])
    .range([ca_height - ca_margins.bottom, ca_margins.top]);

  var ca_y_axis = d3
    .axisRight()
    .scale(ca_y)
    .ticks(d3.max(data, (d) => +d.total_all + 50) / 1000)
    .tickSize(ca_width - ca_margins.left - ca_margins.right)
    .tickFormat((d) => Number(d).toLocaleString());

  var ca_svg = d3
    .select("#stats-image-1")
    .append("svg")
    .attr("id", "ca-svg")
    .attr("viewBox", [0, 0, ca_width, ca_height]);

  ca_svg
    .append("g")
    .attr("class", "ca-x-axis")
    .attr("transform", "translate(0," + (ca_height - ca_margins.bottom) + ")")
    .call(ca_x_axis.ticks(d3.timeYear));

  // Add y axis labels
  ca_svg
    .append("g")
    .attr("class", "ca-y-axis")
    .attr("transform", "translate(" + ca_margins.left + ", 0)")
    // .attr("transform", "translate(" + ca_margins.right + ", 0)")
    .call(ca_y_axis);

  // Data on 1st of each year
  first_year = tidy(
    data,
    filter((d) => d.day === 1 && d.month === 0)
  );

  // Year lines
  // ca_svg
  //  .selectAll("ca-svg")
  //  .data(first_year)
  //  .enter()
  //  .append("line")
  //  .attr("class", "ca-year-lines")
  //  .attr("x1", (d) => ca_x(d3.timeParse("%Y-%m-%d")(d.date)))
  //  .attr("x2", (d) => ca_x(d3.timeParse("%Y-%m-%d")(d.date)))
  //  .attr("y1", ca_y(0))
  //  .attr("y2", ca_y(d3.max(data, (d) => d.total_all)));

  ca_svg
    .append("text")
    .attr("class", "ca-today-text")
    .attr("x", ca_x(d3.max(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))))
    .attr("y", ca_y(d3.max(data, (d) => d.total_all)) - 7.5)
    .text(Number(d3.max(data, (d) => d.total_all)).toLocaleString())
    .attr("alignment-baseline", "middle");

  // // Info for starting at 116
  // ca_svg
  //   .append("text")
  //   .attr("class", "ca-info")
  //   .attr("x", ca_x(d3.min(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))) + 5)
  //   .attr("y", ca_y(d3.min(data, (d) => d.total_all) + 150))
  //   .text(d3.min(data, (d) => d.total_all) + " albums listened to pre-2019")
  //   .attr("alignment-baseline", "middle");

  // define the area
  var ca_area = d3
    .area()
    .x((d) => ca_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .y0((d) => ca_y(0))
    .y1((d) => ca_y(d.total_all));

  // define the line
  var ca_line = d3
    .line()
    .x((d) => ca_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .y((d) => ca_y(d.total_all));

  // fill area under curve
  ca_svg
    .append("path")
    .data([data])
    .attr("class", "ca-area")
    .attr("d", ca_area);

  // add the line.
  ca_svg
    .append("path")
    .data([data])
    .attr("class", "ca-line-all")
    .attr("d", ca_line);
});
