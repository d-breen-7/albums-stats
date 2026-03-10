var recent_margins = { top: 90, right: 70, bottom: 25, left: 10 };

const today = new Date(),
  day_seconds = 60 * 60 * 24 * 1000,
  period_start = new Date();
period_start.setDate(today.getDate() - 28);
period_start.setHours(0, 0, 0, 0);
today.setHours(0, 0, 0, 0);

const legend_1_date = new Date(period_start.getTime() + day_seconds * 4),
  legend_2_date = new Date(period_start.getTime() + day_seconds * 11),
  legend_3_date = new Date(period_start.getTime() + day_seconds * 18);

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/recent",
).then(function (response) {
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
        d3.timeParse("%Y-%m-%d")(d.date) > period_start,
    ),
  );

  var num_albums = data.filter((d) => d.album_id !== "").length,
    new_artist = data.filter((d) => d.artist_status === "1").length,
    num_relistens = data.filter((d) => d.album_status === "1").length,
    relistens_txt =
      num_relistens === 0
        ? "I did not relisten to any albums during this period."
        : `I relistened to <span style='color: #1db954; font-weight: 1000';>${num_relistens}</span> album(s) during this period.`;

  d3.select("#recent-text")
    .append("h2")
    .html(
      `Over the past 28 days I have listened to <span style='color: #1db954; font-weight: 1000';>${num_albums}</span> albums.
      <span style='color: #1db954; font-weight: 1000';>${new_artist} (${Math.round((new_artist / num_albums) * 100 * 10) / 10}%)</span> 
      of these were by new artists who I had not listened to previously (excluding features). 
      ${relistens_txt}`,
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

  // Add X axis
  recent_svg
    .append("g")
    .attr("class", "x-axis-hidden")
    .attr(
      "transform",
      "translate(0," + (recent_height - recent_margins.bottom - 2.5) + ")",
    )
    .call(recent_x_axis);

  var first_date = data[0].listen_date,
    next_day = new Date(
      first_date.getFullYear(),
      first_date.getMonth(),
      first_date.getDate() + 1,
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
          (+d.day_rn === 1),
      ),
    )
    .enter()
    .append("rect")
    .attr("x", (d) => recent_x(d.listen_date))
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
          (+d.day_rn === 1),
      ),
    )
    .enter()
    .append("rect")
    .attr("class", "recent-weekend-rect")
    .attr("x", (d) => recent_x(d.listen_date))
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
          (+d.day_rn === 1),
      ),
    )
    .enter()
    .append("text")
    .attr("x", (d) => recent_x(d.listen_date) + recent_rect_width / 2)
    .attr("y", recent_y(day_max) - 5)
    .text("Today")
    .attr("font-size", "18px")
    .attr("text-anchor", "middle")
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
    .attr("x", (d) => recent_x(d.listen_date) + recent_rect_width * 0.125)
    .attr("rx", 10)
    .attr("y", function (d, i) {
      let day_total = tidy(
        data,
        filter((e) => e.day === d.day && e.month === d.month),
        max("day_rn"),
      );

      diff = day_max - day_total;
      return recent_y(+d.day_rn + diff / 2);
    })
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", recent_rect_height)
    .attr("stroke", (d) => (d.album_status === "1" ? "#191414" : "#1db954"))
    .attr("fill", (d) =>
      d.album_status === "1"
        ? "#1db954"
        : d.artist_status === "1"
          ? "#ffffff"
          : "#dcf9e6",
    );

  // Album label
  recent_svg
    .selectAll("recent-svg")
    .data(data.filter((d) => d.album_id !== ""))
    .enter()
    .append("text")
    .attr("id", "recent-labels")
    .attr("x", (d) => recent_x(d.listen_date) + recent_rect_width / 2)
    .attr("y", function (d, i) {
      let day_total = tidy(
        data,
        filter((e) => e.day === d.day && e.month === d.month),
        max("day_rn"),
      );

      diff = day_max - day_total;
      return recent_y(+d.day_rn + diff / 2) + recent_rect_height * 0.45;
    })
    .text((d) =>
      +d.listen_num > 1 ? d.listen_num : d.album_num === "1" ? "" : d.album_num,
    )
    .attr("fill", (d) => (+d.listen_num > 1 ? "#ffffff" : "#121212"))
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "hanging")
    .attr("font-weight", "750")
    .attr("visibility", "hidden");

  // Legend elements
  recent_svg
    .append("rect")
    .attr("x", recent_margins.left)
    .attr("y", 10)
    .attr("width", recent_rect_width * 2)
    .attr("height", 60)
    .attr("fill", wk_end.url());

  recent_svg
    .append("rect")
    .attr("class", "recent-rect")
    .attr("x", recent_x(legend_1_date) + recent_rect_width * 0.125)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", 60)
    .attr("stroke", "#1db954")
    .attr("fill", "#ffffff");

  recent_svg
    .append("rect")
    .attr("class", "recent-rect")
    .attr("x", recent_x(legend_2_date) + recent_rect_width * 0.125)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", 60)
    .attr("stroke", "#1db954")
    .attr("fill", "#dcf9e6");

  recent_svg
    .append("rect")
    .attr("class", "recent-rect")
    .attr("x", recent_x(legend_3_date) + recent_rect_width * 0.125)
    .attr("y", 10)
    .attr("ry", 10)
    .attr("width", recent_rect_width * 0.75)
    .attr("height", 60)
    .attr("stroke", "#191414")
    .attr("fill", "#1db954");

  let legend_text = [
    {
      text: "Weekend",
      x: recent_margins.left + recent_rect_width,
      y: 35,
      label: false,
      anchor: "middle",
      fill: "#121212",
      weight: "500",
    },
    {
      text: "1st album by artist",
      x: recent_x(legend_1_date) + recent_rect_width,
      y: 25,
      label: false,
      anchor: "start",
      fill: "#121212",
      weight: "500",
    },
    {
      text: "New album by artist",
      x: recent_x(legend_2_date) + recent_rect_width,
      y: 25,
      label: false,
      anchor: "start",
      fill: "#121212",
      weight: "500",
    },
    {
      text: "N",
      x: recent_x(legend_2_date) + recent_rect_width / 2,
      y: 35,
      label: true,
      anchor: "middle",
      fill: "#121212",
      weight: "750",
    },
    {
      text: "N-th album by artist",
      x: recent_x(legend_2_date) + recent_rect_width,
      y: 45,
      label: true,
      anchor: "start",
      fill: "#a9a9a9",
      weight: "500",
    },
    {
      text: "Album relisten",
      x: recent_x(legend_3_date) + recent_rect_width,
      y: 25,
      label: false,
      anchor: "start",
      fill: "#121212",
      weight: "500",
    },
    {
      text: "I-th time listening to album",
      x: recent_x(legend_3_date) + recent_rect_width,
      y: 45,
      label: true,
      anchor: "start",
      fill: "#a9a9a9",
      weight: "500",
    },
    {
      text: "I",
      x: recent_x(legend_3_date) + recent_rect_width / 2,
      y: 35,
      label: true,
      anchor: "middle",
      fill: "#ffffff",
      weight: "750",
    },
  ];

  recent_svg
    .selectAll("recent-svg")
    .data(legend_text)
    .enter()
    .append("text")
    .attr("id", (d) => (d.label === true ? "recent-labels" : ""))
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .text((d) => d.text)
    .attr("visibility", (d) => (d.label === true ? "hidden" : "visible"))
    .attr("text-anchor", (d) => d.anchor)
    .attr("fill", (d) => d.fill)
    .attr("font-weight", (d) => d.weight)
    .attr("alignment-baseline", "hanging")
    .attr("font-size", "18px");

  d3.selectAll('input[name="recent-toggle"]').on("change", function () {
    if (this.checked) {
      d3.selectAll("#recent-labels").attr("visibility", "visible");
    } else {
      d3.selectAll("#recent-labels").attr("visibility", "hidden");
    }
  });

  hideLoader("recent");
});
