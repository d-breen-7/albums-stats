var recent_margins = { top: 90, right: 70, bottom: 25, left: 10 };

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

  var num_albums = data.filter((d) => d.album_id !== "").length,
    new_artist = data.filter((d) => d.artist_status === "1").length,
    num_relistens = data.filter((d) => d.album_status === "1").length,
    relistens_txt =
      num_relistens === 0
        ? "I didn't relisten to any albums during this period."
        : `I relistned to <span style='color: #1db954; font-weight: 1000';>${num_relistens}</span> albums during this period.`;

  d3.select("#recent-text")
    .append("h2")
    .html(
      `Over the past 28 days, I've listened to <span style='color: #1db954; font-weight: 1000';>${num_albums}</span> albums.
      <span style='color: #1db954; font-weight: 1000';>${new_artist}</span> albums were by artists I had not listened to previously. 
      ${relistens_txt}`
    );

  var recent_width = d3.select("#recent-image").node().offsetWidth,
    recent_height = d3.select("#recent-image").node().offsetHeight;

  // Add X axis
  var recent_x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d3.timeParse("%Y-%m-%d")(d.date)))
    .range([recent_margins.left, recent_width - recent_margins.right]);

  var recent_x_axis = d3
    .axisBottom(recent_x)
    .ticks(d3.timeMonday.every(1))
    .tickFormat(d3.timeFormat("%_d %b"));

  var day_max = d3.max(data, (d) => +d.day_rn);
  // Add Y axis
  var recent_y = d3
    .scaleLinear()
    .domain([0, day_max])
    .range([recent_height - recent_margins.bottom, recent_margins.top]);

  var recent_svg = d3
    .select("#recent-image")
    .append("svg")
    .attr("id", "recent-svg")
    .attr("viewBox", [0, 0, recent_width, recent_height]);

  var first_date = data[0].listen_date,
    next_day = new Date(
      first_date.getFullYear(),
      first_date.getMonth(),
      first_date.getDate() + 1
    ),
    recent_rect_width = recent_x(next_day) - recent_x(first_date);

  var recent_rect_height = recent_y(0) - recent_y(1) - 7.5;

  wk_end = textures
    .lines()
    .orientation("vertical", "horizontal")
    .size(4)
    .strokeWidth(1)
    .shapeRendering("crispEdges")
    .background("#ffffff")
    .stroke("#dcf9e6");

  // Background for today
  recent_svg
    .selectAll("recent-svg")
    .data(
      data.filter(
        (d) =>
          (d.listen_date.getDate() === today.getDate()) &
          (d.listen_date.getMonth() === today.getMonth()) &
          (d.listen_date.getFullYear() === today.getFullYear()) &
          (d.day_rn === 1)
      )
    )
    .enter()
    .append("rect")
    .attr("x", (d) => recent_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .attr("y", recent_y(day_max))
    .attr("width", recent_rect_width)
    .attr("height", recent_height - recent_margins.top - 25)
    .attr("fill", "#a9a9a9")
    .attr("opacity", 0.1);

  recent_svg.call(wk_end);

  // Weekend background
  recent_svg
    .selectAll("recent-svg")
    .data(
      data.filter(
        (d) =>
          ((d.listen_date.getDay() === 6) | (d.listen_date.getDay() === 0)) &
          (d.day_rn === 1)
      )
    )
    .enter()
    .append("rect")
    .attr("class", "recent-weekend-rect")
    .attr("x", (d) => recent_x(d3.timeParse("%Y-%m-%d")(d.date)))
    .attr("y", recent_y(day_max))
    .attr("width", recent_rect_width)
    .attr("height", recent_height - recent_margins.top)
    .attr("fill", wk_end.url())
    .attr("opacity", 1);

  // Today label
  recent_svg
    .selectAll("recent-svg")
    .data(
      data.filter(
        (d) =>
          (d.listen_date.getDate() === today.getDate()) &
          (d.listen_date.getMonth() === today.getMonth()) &
          (d.listen_date.getFullYear() === today.getFullYear()) &
          (d.day_rn === 1)
      )
    )
    .enter()
    .append("text")
    .attr("x", (d) => recent_x(d3.timeParse("%Y-%m-%d")(d.date)) - 5)
    .attr("y", recent_y(day_max))
    .text("Today")
    .attr("font-size", "18px")
    .attr("font-weight", 1000)
    .attr("opacity", 1);

  // Add albums
  recent_svg
    .selectAll("recent-svg")
    .data(data.filter((d) => d.album_id !== ""))
    .enter()
    .append("rect")
    .attr("class", "recent-rect")
    .attr("id", (d) => d.album_id)
    .attr(
      "x",
      (d) =>
        recent_x(d3.timeParse("%Y-%m-%d")(d.date)) + recent_rect_width * 0.125
    )
    .attr("rx", 10)
    .attr("y", function (d, i) {
      let day_total = tidy(
        data,
        filter((e) => e.day === d.day && e.month === d.month),
        max("day_rn")
      );

      diff = day_max - day_total;
      return recent_y(d.day_rn + diff / 2);
    })
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", recent_rect_height)
    .attr("stroke", (d) => (d.album_status === 1 ? "#191414" : "#1db954"))
    .attr("fill", (d) =>
      d.album_status === "1"
        ? "#1db954"
        : d.artist_status === "1"
        ? "#ffffff"
        : "#dcf9e6"
    );

  recent_svg
    .append("g")
    .attr("class", "x-axis")
    .attr(
      "transform",
      "translate(0," + (recent_height - recent_margins.bottom - 2.5) + ")"
    )
    .call(recent_x_axis);

  recent_svg
    .append("rect")
    .attr("x", recent_margins.left)
    .attr("y", 10)
    .attr("width", recent_rect_width * 2)
    .attr("height", 40)
    .attr("fill", wk_end.url());

  recent_svg
    .append("rect")
    .attr("class", "recent-rect")
    .attr("x", recent_rect_width * 6)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", 40)
    .attr("stroke", "#1db954")
    .attr("fill", "#dcf9e6");

  recent_svg
    .append("rect")
    .attr("class", "recent-rect")
    .attr("x", recent_rect_width * 4)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", 40)
    .attr("stroke", "#1db954")
    .attr("fill", "#ffffff");

  recent_svg
    .append("rect")
    .attr("class", "recent-rect")
    .attr("x", recent_rect_width * 8)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", 40)
    .attr("stroke", "#191414")
    .attr("fill", "#1db954");

  let legend_text = [
    { text: "Weekend", x: recent_margins.left + recent_rect_width, y: 55 },
    {
      text: "New",
      x: recent_rect_width * 4 + (recent_rect_width * 0.75) / 2,
      y: 55,
    },
    {
      text: "artist",
      x: recent_rect_width * 4 + (recent_rect_width * 0.75) / 2,
      y: 70,
    },
    {
      text: "New",
      x: recent_rect_width * 6 + (recent_rect_width * 0.75) / 2,
      y: 55,
    },
    {
      text: "album",
      x: recent_rect_width * 6 + (recent_rect_width * 0.75) / 2,
      y: 70,
    },
    {
      text: "Album",
      x: recent_rect_width * 8 + (recent_rect_width * 0.75) / 2,
      y: 55,
    },
    {
      text: "relisten",
      x: recent_rect_width * 8 + (recent_rect_width * 0.75) / 2,
      y: 70,
    },
  ];

  recent_svg
    .selectAll("recent-svg")
    .data(legend_text)
    .enter()
    .append("text")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .text((d) => d.text)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("font-size", "18px");
});
