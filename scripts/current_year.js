var cy_margins = { top: 20, right: 50, bottom: 25, left: 10 };

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/current-year"
).then(function (response) {
  var data = tidy(
    response.data,
    mutate({
      day: (d) => d3.timeParse("%Y-%m-%d")(d.date).getDate(),
      month: (d) => d3.timeParse("%Y-%m-%d")(d.date).getMonth(),
      year: (d) => d3.timeParse("%Y-%m-%d")(d.date).getFullYear(),
    })
  );

  var new_albums = response.new_albums,
    new_artists = response.new_artists,
    total_albums = d3.max(data, (d) => d.total_all);

  // Add sub-title text
  d3.select("#stats-2-title").append("h1").html(data[0].year);

  // Add sub-title text
  d3.select("#stats-2-text")
    .append("h2")
    .html(
      "So far this year I've listened to " +
        Number(new_albums).toLocaleString() +
        " albums, " +
        Number(total_albums).toLocaleString() +
        " when including relistens. I've listened to " +
        Number(new_artists).toLocaleString() +
        " new artists"
    );

  var cy_width = d3.select("#stats-image-2").node().offsetWidth,
    cy_height = d3.select("#stats-image-2").node().offsetHeight;

  // Add X axis
  var cy_x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d3.timeParse("%Y-%m-%d")(d.date)))
    .range([cy_margins.left, cy_width - cy_margins.right]);

  var cy_x_axis = d3
    .axisBottom(cy_x)
    .ticks(d3.timeMonth)
    .tickFormat(d3.timeFormat("%b"));

  // Add Y axis
  var cy_y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d.total_all + 5)])
    .range([cy_height - cy_margins.bottom, cy_margins.top]);

  var cy_y_axis = d3
    .axisRight()
    .scale(cy_y)
    .ticks(d3.max(data, (d) => +d.total_all + 5) / 200)
    .tickSize(cy_width - cy_margins.left - cy_margins.right)
    .tickFormat((d) => Number(d).toLocaleString());

  var cy_svg = d3
    .select("#stats-image-2")
    .append("svg")
    .attr("id", "cy-svg")
    .attr("viewBox", [0, 0, cy_width, cy_height]);

  cy_svg
    .append("g")
    .attr("class", "ca-x-axis")
    .attr("transform", "translate(0," + (cy_height - cy_margins.bottom) + ")")
    .call(cy_x_axis);

  // Add y axis labels
  cy_svg
    .append("g")
    .attr("class", "ca-y-axis")
    .attr("transform", "translate(" + cy_margins.left + ", 0)")
    .call(cy_y_axis);

  // // Data on 1st of each year
  first_month = tidy(
    data,
    filter((d) => d.day === 1)
  );

  // Year lines
  cy_svg
    .selectAll("cy-svg")
    .data(first_month)
    .enter()
    .append("line")
    .attr("class", "ca-year-lines")
    .attr("x1", (d) => cy_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .attr("x2", (d) => cy_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .attr("y1", cy_y(0))
    .attr("y2", cy_y(d3.max(data, (d) => d.total_all)));

  cy_svg
    .append("text")
    .attr("class", "ca-today-text")
    .attr("x", cy_x(d3.max(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))))
    .attr("y", cy_y(d3.max(data, (d) => d.total_all)) - 7.5)
    .text(Number(d3.max(data, (d) => d.total_all)).toLocaleString())
    .attr("alignment-baseline", "middle");

  // define the area
  var cy_area_all = d3
    .area()
    .x((d) => cy_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .y0((d) => cy_y(0))
    .y1((d) => cy_y(d.total_all));

  // define the line
  var cy_line_all = d3
    .line()
    .x((d) => cy_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .y((d) => cy_y(d.total_all));

  var cy_area_new = d3
    .area()
    .x((d) => cy_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .y0((d) => cy_y(0))
    .y1((d) => cy_y(d.total_new));

  // define the line
  var cy_line_new = d3
    .line()
    .x((d) => cy_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .y((d) => cy_y(d.total_new));

  // fill area under curve
  cy_svg
    .append("path")
    .data([data])
    .attr("class", "ca-area")
    .attr("d", cy_area_all);

  // add the line.
  cy_svg
    .append("path")
    .data([data])
    .attr("class", "ca-line-all")
    .attr("d", cy_line_all);

  // fill area under curve
  cy_svg
    .append("path")
    .data([data])
    .attr("class", "cy-area-new")
    .attr("d", cy_area_new);

  // add the line.
  cy_svg
    .append("path")
    .data([data])
    .attr("class", "cy-line-new")
    .attr("d", cy_line_new);

  // Legend
  cy_svg
    .append("text")
    .attr("class", "cy-legend")
    .attr("x", cy_x(d3.min(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))) + 15)
    .attr("y", cy_y(d3.max(data, (d) => d.total_all)))
    .text("All Albums")
    .attr("alignment-baseline", "middle");

  cy_svg
    .append("polyline")
    .attr("class", "cy-legend-1")
    .attr("points", [
      [
        cy_x(d3.min(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))) + 15,
        cy_y(d3.max(data, (d) => d.total_all)) + 10,
      ],
      [
        cy_x(d3.min(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))) + 100,
        cy_y(d3.max(data, (d) => d.total_all)) + 10,
      ],
    ]);

  cy_svg
    .append("text")
    .attr("class", "cy-legend")
    .attr("x", cy_x(d3.min(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))) + 15)
    .attr("y", cy_y(d3.max(data, (d) => d.total_all)) + 40)
    .text("New Artist")
    .attr("alignment-baseline", "middle");

  cy_svg
    .append("polyline")
    .attr("class", "cy-legend-2")
    .attr("points", [
      [
        cy_x(d3.min(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))) + 15,
        cy_y(d3.max(data, (d) => d.total_all)) + 50,
      ],
      [
        cy_x(d3.min(data, (d) => d3.timeParse("%Y-%m-%d")(d.date))) + 100,
        cy_y(d3.max(data, (d) => d.total_all)) + 50,
      ],
    ]);
});
