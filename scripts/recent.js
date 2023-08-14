var ra_margins = { top: 80, right: 70, bottom: 25, left: 10 };

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/recent"
).then(function (response) {
  const today = new Date();
  const period_start = new Date(new Date().setDate(today.getDate() - 28));

  var data = tidy(
    response.data,
    mutate({
      listen_date: (d) => d3.timeParse("%Y-%m-%d")(d.date),
      day: (d) => d3.timeParse("%Y-%m-%d")(d.date).getDate(),
      month: (d) => d3.timeParse("%Y-%m-%d")(d.date).getMonth(),
    }),
    filter(
      (d) =>
        d3.timeParse("%Y-%m-%d")(d.date) <= today &&
        d3.timeParse("%Y-%m-%d")(d.date) > period_start
    )
  );

  var num_albums = data.filter((d) => d.album_id !== "").length;

  d3.select("#stats-3-text")
    .append("h2")
    .html("Over the past 28 days I've listened to " + num_albums + " albums");

  var ra_width = d3.select("#stats-image-3").node().offsetWidth,
    ra_height = d3.select("#stats-image-3").node().offsetHeight;

  // Add X axis
  var ra_x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d3.timeParse("%Y-%m-%d")(d.date)))
    .range([ra_margins.left, ra_width - ra_margins.right]);

  var ra_x_axis = d3
    .axisBottom(ra_x)
    .ticks(d3.timeMonday.every(1))
    .tickFormat(d3.timeFormat("%_d %b"));

  var day_max = d3.max(data, (d) => +d.day_rn);
  // Add Y axis
  var ra_y = d3
    .scaleLinear()
    .domain([0, day_max])
    .range([ra_height - ra_margins.bottom, ra_margins.top]);

  var ra_svg = d3
    .select("#stats-image-3")
    .append("svg")
    .attr("id", "ra-svg")
    .attr("viewBox", [0, 0, ra_width, ra_height]);

  var first_date = data[0].listen_date,
    next_day = new Date(
      first_date.getFullYear(),
      first_date.getMonth(),
      first_date.getDate() + 1
    ),
    rect_width = ra_x(next_day) - ra_x(first_date);

  var ra_rect_height = ra_y(0) - ra_y(1) - 7.5;

  wk_end = textures
    .lines()
    .orientation("vertical", "horizontal")
    .size(4)
    .strokeWidth(1)
    .shapeRendering("crispEdges")
    .background("#ffffff")
    .stroke("#dcf9e6");

  ra_svg.call(wk_end);

  // Weekend background
  ra_svg
    .selectAll("ra-svg")
    .data(
      data.filter(
        (d) => (d.listen_date.getDay() === 6) | (d.listen_date.getDay() === 0)
      )
    )
    .enter()
    .append("rect")
    .attr("x", (d) => ra_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .attr("y", ra_y(day_max))
    .attr("width", rect_width)
    .attr("height", ra_height)
    .attr("fill", wk_end.url())
    .attr("opacity", 1);

  ra_svg
    .selectAll("ra-svg")
    .data(data.filter((d) => d.album_id !== ""))
    .enter()
    .append("rect")
    .attr("class", "ra-rect")
    .attr("id", (d) => d.album_id)
    .attr(
      "x",
      (d) => ra_x(d3.timeParse("%Y-%m-%d")(d.date)) + rect_width * 0.125
    )
    .attr("rx", 10)
    .attr("y", function (d, i) {
      let day_total = tidy(
        data,
        filter((e) => e.day === d.day && e.month === d.month),
        max("day_rn")
      );

      diff = day_max - day_total;
      return ra_y(d.day_rn + diff / 2);
    })
    .attr("ry", 10)
    .attr("width", rect_width * 0.75)
    .attr("height", ra_rect_height)
    .attr("stroke", (d) => (d.album_status === 1 ? "#191414" : "#1db954"))
    .attr("fill", (d) =>
      d.album_status === 1
        ? "#1db954"
        : d.artist_status === 1
        ? "#ffffff"
        : "#dcf9e6"
    );

  ra_svg
    .append("g")
    .attr("class", "ca-x-axis")
    .attr(
      "transform",
      "translate(0," + (ra_height - ra_margins.bottom - 2.5) + ")"
    )
    .call(ra_x_axis);

  ra_svg
    .append("rect")
    .attr("x", ra_margins.left)
    .attr("y", 10)
    .attr("width", rect_width * 2)
    .attr("height", 40)
    .attr("fill", wk_end.url());

  ra_svg
    .append("rect")
    .attr("class", "ra-rect")
    .attr("x", rect_width * 4)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", rect_width * 0.75)
    .attr("height", 40)
    .attr("stroke", "#191414")
    .attr("fill", "#1db954");

  ra_svg
    .append("rect")
    .attr("class", "ra-rect")
    .attr("x", rect_width * 6)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", rect_width * 0.75)
    .attr("height", 40)
    .attr("stroke", "#1db954")
    .attr("fill", "#dcf9e6");

  ra_svg
    .append("rect")
    .attr("class", "ra-rect")
    .attr("x", rect_width * 8)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", rect_width * 0.75)
    .attr("height", 40)
    .attr("stroke", "#1db954")
    .attr("fill", "#ffffff");

  let legend_text = [
    { text: "Weekend", x: ra_margins.left + rect_width, y: 55 },
    { text: "Album", x: rect_width * 4 + (rect_width * 0.75) / 2, y: 55 },
    { text: "Repeat", x: rect_width * 4 + (rect_width * 0.75) / 2, y: 70 },
    { text: "Artist", x: rect_width * 6 + (rect_width * 0.75) / 2, y: 55 },
    { text: "Repeat", x: rect_width * 6 + (rect_width * 0.75) / 2, y: 70 },
    { text: "New", x: rect_width * 8 + (rect_width * 0.75) / 2, y: 55 },
    { text: "Artist", x: rect_width * 8 + (rect_width * 0.75) / 2, y: 70 },
  ];

  ra_svg
    .selectAll("ra-svg")
    .data(legend_text)
    .enter()
    .append("text")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .text((d) => d.text)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging");
});
