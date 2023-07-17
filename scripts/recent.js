var ra_margins = { top: 20, right: 40, bottom: 25, left: 40 };

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/recent"
).then(function (response) {
  var data = tidy(
    response.data,
    mutate({
      listen_date: (d) => d3.timeParse("%Y-%m-%d")(d.date),
      day: (d) => d3.timeParse("%Y-%m-%d")(d.date).getDate(),
      month: (d) => d3.timeParse("%Y-%m-%d")(d.date).getMonth(),
    })
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

  var ra_rect_height = ra_y(0) - ra_y(1) - 5;

  // Week bands
  ra_svg
    .selectAll("ra-svg")
    .data(data.filter((d) => d.listen_date.getDay() === 1))
    .enter()
    .append("rect")
    .attr("x", (d) => ra_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .attr("y", ra_y(day_max))
    .attr("width", rect_width * 5)
    .attr("height", ra_height)
    .attr("fill", "#e9fff4")
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
      shift_odd = diff * (ra_rect_height / 1.5);

      return ra_y(d.day_rn) - shift_odd;
    })
    .attr("ry", 10)
    .attr("width", rect_width * 0.75)
    .attr("height", ra_rect_height)
    .attr("stroke", (d) =>
      d.album_status === 1
        ? "#1db954"
        : d.artist_status === 1
        ? "#1db954"
        : "#a9a9a9"
    )
    .attr("fill", (d) => (d.album_status === 1 ? "#1db954" : "#ffffff"))
    .text((d) => d.artist_status + " | " + d.album_status);

  ra_svg
    .append("g")
    .attr("class", "ca-x-axis")
    .attr("transform", "translate(0," + (ra_height - ra_margins.bottom) + ")")
    .call(ra_x_axis);
});
