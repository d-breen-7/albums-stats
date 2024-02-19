var ca_margins = { top: 20, right: 55, bottom: 25, left: 10 },
  ca_width = d3.select("#stats-image-1").node().offsetWidth,
  ca_height = d3.select("#stats-image-1").node().offsetHeight;
(current_year = new Date().getFullYear()),
  (parse_date = d3.timeParse("%Y-%m-%d"));

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/albums"
).then(function (response) {
  var res_data = tidy(
    response.data,
    mutate({
      year: (d) => parse_date(d.date).getFullYear(),
      day: (d) => parse_date(d.date).getDate(),
      month: (d) => parse_date(d.date).getMonth(),
      norm_date: (d) =>
        new Date(
          current_year,
          parse_date(d.date).getMonth(),
          parse_date(d.date).getDate()
        ),
    })
  );

  // TODO: update logic backend
  res_data[0].day_count_all = 0;

  var data = group_by_year(res_data),
    total_albums = Number(d3.max(data, (d) => d.total_all)).toLocaleString();

  // Define SVG
  var ca_svg = d3
    .select("#stats-image-1")
    .append("svg")
    .attr("id", "ca-svg")
    .attr("viewBox", [0, 0, ca_width, ca_height]);

  // Define tooltip
  var tooltip = d3
    .select("#stats-image-1")
    .append("div")
    .attr("class", "ca-tooltip")
    .style("visibility", "hidden");

  // X axis
  var ca_x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => parse_date(d.date)))
    .range([ca_margins.left, ca_width - ca_margins.right]);

  var ca_x_axis = d3.axisBottom(ca_x).ticks(d3.timeYear);

  ca_svg
    .append("g")
    .attr("class", "ca-x-axis")
    .attr("transform", "translate(0," + (ca_height - ca_margins.bottom) + ")")
    .call(ca_x_axis);

  // Y axis
  var ca_y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d.total_all + 5)])
    .range([ca_height - ca_margins.bottom, ca_margins.top]);

  var ca_y_axis = d3
    .axisRight()
    .scale(ca_y)
    .ticks(d3.max(data, (d) => +d.total_all) / 1000)
    .tickSize(ca_width - ca_margins.left - ca_margins.right)
    .tickFormat((d) => Number(d).toLocaleString());

  ca_svg
    .append("g")
    .attr("class", "ca-y-axis")
    .attr("transform", "translate(" + ca_margins.left + ", 0)")
    .call(ca_y_axis);

  // Year grid line
  ca_svg
    .selectAll("ca-svg")
    .data(data.filter((d) => d.day === 1 && d.month === 0))
    .enter()
    .append("line")
    .attr("class", "ca-year-lines")
    .attr("id", "ca-year-lines")
    .attr("x1", (d) => ca_x(parse_date(d.date)))
    .attr("x2", (d) => ca_x(parse_date(d.date)))
    .attr("y1", ca_y(0))
    .attr("y2", ca_y(d3.max(data, (d) => d.total_all)));

  // Albums area
  var ca_area = d3
    .area()
    .x((d) => ca_x(parse_date(d.date)))
    .y0(ca_y(0))
    .y1((d) => ca_y(d.total_all));

  ca_svg
    .append("path")
    .data([data])
    .attr("class", "ca-area")
    .attr("d", ca_area);

  // Albums line
  var ca_line = d3
    .line()
    .x((d) => ca_x(parse_date(d.date)))
    .y((d) => ca_y(d.total_all));

  ca_svg
    .append("path")
    .data([data])
    .attr("class", "ca-line-all")
    .attr("d", ca_line);

  // Add heading sub text
  d3.select("#stats-1-text")
    .append("h2")
    .attr("id", "stats-1-sub-text")
    .html(
      "I've listened to <span style='color: #1db954; font-weight: 1000';>" +
        total_albums +
        "</span> albums (including re-listens) since I started tracking in 2019"
    );

  // Text for total
  ca_svg
    .append("text")
    .attr("class", "ca-today-text")
    .attr("id", "ca-today-text")
    .attr("x", ca_x(d3.max(data, (d) => parse_date(d.date))))
    .attr("y", ca_y(d3.max(data, (d) => d.total_all)) - 7.5)
    .text(Number(d3.max(data, (d) => d.total_all)).toLocaleString())
    .attr("alignment-baseline", "middle");

  function transition_period(period) {
    // Remove existing elements
    d3.select("#stats-1-sub-text").remove();
    d3.select("#ca-today-text").remove();
    d3.selectAll("#ca-ytd-text").remove();
    d3.selectAll("#ca-year-lines").remove();
    d3.selectAll(".ca-line-all").remove();
    d3.selectAll(".ca-line-current").remove();
    d3.selectAll(".ca-line-old").remove();
    d3.selectAll(".ca-area").remove();
    d3.selectAll("#clip").remove();

    if (period !== "ytd") {
      // Logic for specific years/all time
      var period_data =
          period === "all-time" ? data : data.filter((d) => d.year == period),
        period_total =
          period === "all-time"
            ? d3.max(period_data, (d) => +d.total_all)
            : d3.max(period_data, (d) => +d.cum_sum);

      // Update X axis
      var ca_x = d3
        .scaleTime()
        .domain(d3.extent(period_data, (d) => parse_date(d.date)))
        .range([ca_margins.left, ca_width - ca_margins.right]);

      var ca_x_axis =
        period === "all-time"
          ? d3.axisBottom(ca_x).ticks(d3.timeYear)
          : d3
              .axisBottom(ca_x)
              .ticks(d3.timeMonth)
              .tickFormat(d3.timeFormat("%b"));

      ca_svg
        .select(".ca-x-axis")
        .transition()
        .duration(1000)
        .attr(
          "transform",
          "translate(0," + (ca_height - ca_margins.bottom) + ")"
        )
        .call(ca_x_axis);

      // Update Y axis
      var ca_y = d3
        .scaleLinear()
        .domain([0, period_total])
        .range([ca_height - ca_margins.bottom, ca_margins.top]);

      var ca_y_axis = d3
        .axisRight()
        .scale(ca_y)
        .ticks(
          period_total < 10
            ? period_total / 1
            : period_total < 50
            ? period_total / 5
            : period_total < 100
            ? period_total / 10
            : period_total < 200
            ? period_total / 25
            : period_total < 600
            ? period_total / 100
            : period_total < 1000
            ? period_total / 200
            : period_total < 2500
            ? period_total / 250
            : period_total / 1000
        )
        .tickSize(ca_width - ca_margins.left - ca_margins.right)
        .tickFormat((d) => Number(d).toLocaleString());

      ca_svg
        .select(".ca-y-axis")
        .transition()
        .duration(1000)
        .attr("transform", "translate(" + ca_margins.left + ", 0)")
        .call(ca_y_axis);

      // Update year grid lines
      ca_svg
        .selectAll("ca-svg")
        .data(
          period === "all-time"
            ? data.filter((d) => d.day === 1 && d.month === 0)
            : period_data.filter((d) => d.day === 1)
        )
        .enter()
        .append("line")
        .attr("class", "ca-year-lines")
        .attr("id", "ca-year-lines")
        .attr("x1", (d) => ca_x(parse_date(d.date)))
        .attr("x2", (d) => ca_x(parse_date(d.date)))
        .attr("y1", ca_y(period_total))
        .attr("y2", ca_y(0));

      // Update Area
      var ca_area =
        period == "all-time"
          ? d3
              .area()
              .x((d) => ca_x(parse_date(d.date)))
              .y0(ca_y(0))
              .y1((d) => ca_y(d.total_all))
          : d3
              .area()
              .x((d) => ca_x(parse_date(d.date)))
              .y0(ca_y(0))
              .y1((d) => ca_y(d.cum_sum));

      // Define a clipPath
      ca_svg
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", 0)
        .attr("height", "100%");

      ca_svg
        .append("path")
        .attr("class", "ca-area")
        .data([period_data])
        .attr("d", ca_area)
        .attr("clip-path", "url(#clip)");

      ca_svg
        .select("#clip rect")
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr("width", ca_width);

      // Update Line
      var ca_line = d3
        .line()
        .x((d) => ca_x(parse_date(d.date)))
        .y((d) => ca_y(period === "all-time" ? d.total_all : d.cum_sum));

      var new_line = ca_svg
        .append("path")
        .data([period_data])
        .attr("class", "ca-line-all")
        .attr("d", ca_line);

      total_length = new_line.node().getTotalLength();

      new_line
        .attr("stroke-dasharray", total_length + " " + total_length)
        .attr("stroke-dashoffset", total_length)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Update heading sub text
      var summary_text =
        period == "all-time"
          ? "I've listened to <span style='color: #1db954; font-weight: 1000';>" +
            Number(period_total).toLocaleString() +
            "</span> albums since I started tracking in 2019"
          : period == current_year
          ? "So far this year, I've listened to <span style='color: #1db954; font-weight: 1000';>" +
            Number(period_total).toLocaleString() +
            "</span> albums"
          : "In " +
            period +
            ", I listened to <span style='color: #1db954; font-weight: 1000';>" +
            Number(period_total).toLocaleString() +
            "</span> albums";

      d3.select("#stats-1-text")
        .append("h2")
        .attr("id", "stats-1-sub-text")
        .html(summary_text);

      // Update total text
      ca_svg
        .append("text")
        .attr("class", "ca-today-text")
        .attr("id", "ca-today-text")
        .attr("x", ca_x(d3.max(period_data, (d) => parse_date(d.date))))
        .attr("y", ca_y(period_total) - 7.5)
        .text("")
        .transition()
        .delay(1000)
        .text(Number(period_total).toLocaleString())
        .attr("alignment-baseline", "middle");
    } else {
      // Logic for when ytd selected
      var ytd = d3.max(
        data.filter((d) => d.year == current_year),
        (d) => d.norm_date
      );

      ytd_data = data.filter((d) => d.norm_date <= ytd);
      ytd_data.filter((d) => d.day == 1 && d.month === 0).forEach((d) => (d.cum_sum = 0)); // added month condition

      // Update X axis
      var ca_x = d3
        .scaleTime()
        .domain(
          d3.extent(
            ytd_data.filter((d) => d.year == current_year),
            (d) => d.norm_date
          )
        )
        .range([ca_margins.left, ca_width - ca_margins.right]);

      var ca_x_axis = d3
        .axisBottom(ca_x)
        .ticks(d3.timeMonth)
        .tickFormat(d3.timeFormat("%b"));

      ca_svg
        .select(".ca-x-axis")
        .transition()
        .duration(1000)
        .attr(
          "transform",
          "translate(0," + (ca_height - ca_margins.bottom) + ")"
        )
        .call(ca_x_axis);

      // Update Y axis
      period_total = d3.max(ytd_data, (d) => +d.cum_sum);

      var ca_y = d3
        .scaleLinear()
        .domain([0, period_total])
        .range([ca_height - ca_margins.bottom, ca_margins.top]);

      var axis_shift = period_total < 10 ? 15 : period_total < 100 ? 30 : 50;

      var ca_y_axis = d3
        .axisLeft()
        .scale(ca_y)
        .ticks(
          period_total < 10
            ? period_total / 1
            : period_total < 50
            ? period_total / 5
            : period_total < 100
            ? period_total / 10
            : period_total < 200
            ? period_total / 25
            : period_total < 600
            ? period_total / 100
            : period_total < 1000
            ? period_total / 200
            : period_total < 2500
            ? period_total / 250
            : period_total / 1000
        )
        .tickSize(-ca_width + ca_margins.left + ca_margins.right + axis_shift)
        .tickPadding(axis_shift)
        .tickFormat((d) => (d == 0 ? "" : Number(d).toLocaleString()));

      ca_svg
        .select(".ca-y-axis")
        .transition()
        .duration(1000)
        .attr(
          "transform",
          "translate(" + (ca_margins.left + axis_shift) + ", 0)"
        )
        .call(ca_y_axis);

      // Loop through each year of data
      d3.set(ytd_data.map((d) => d.year))
        .values()
        .forEach((year, i) => {
          // Draw line
          var ca_line = d3
            .line()
            .x((d) => ca_x(d.norm_date))
            .y((d) => ca_y(d.cum_sum));

          var new_line = ca_svg
            .append("path")
            .data([ytd_data.filter((d) => d.year == year)])
            .attr("class", "ca-line-all")
            .attr("d", ca_line);

          total_length = new_line.node().getTotalLength();

          new_line
            .attr("stroke-dasharray", total_length + " " + total_length)
            .attr("stroke-dashoffset", total_length)
            .transition()
            .delay(i * 1100)
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .transition()
            .duration(0)
            .attr(
              "class",
              year == current_year ? "ca-line-current" : "ca-line-old"
            );

          // Rank Years
          rank = tidy(
            ytd_data,
            filter(
              (d) =>
                d.norm_date.getFullYear() === ytd.getFullYear() &&
                d.norm_date.getMonth() === ytd.getMonth() &&
                d.norm_date.getDate() === ytd.getDate()
            ),
            arrange(desc("cum_sum")),
            mutate({ ytd_rank: (_, i) => i + 1 })
          );

          var year_rank =
            year +
            " (" +
            rank.filter((d) => d.year == year)[0]["ytd_rank"] +
            ")";

          // Year label
          ca_svg
            .append("text")
            .attr("class", "ca-ytd-text")
            .attr("id", "ca-ytd-text")
            .attr(
              "y",
              ca_y(
                d3.max(
                  ytd_data.filter((d) => d.year == year),
                  (d) => d.cum_sum
                )
              )
            )
            .attr("x", ca_x(d3.max(ytd_data, (d) => d.norm_date)))
            .text("")
            .attr("alignment-baseline", "middle")
            .transition()
            .delay(i * 1100 + 500)
            .duration(0)
            .text(year)
            .transition()
            .delay(1000)
            .duration(0)
            .attr(
              "class",
              year == current_year ? "ca-ytd-text" : "ca-ytd-text-old"
            );
        });

      // Update year grid lines
      ca_svg
        .selectAll("ca-svg")
        .data(ytd_data.filter((d) => d.day === 1 && d.year == current_year))
        .enter()
        .append("line")
        .attr("class", "ca-year-lines")
        .attr("id", "ca-year-lines")
        .attr("x1", (d) => ca_x(d.norm_date))
        .attr("x2", (d) => ca_x(d.norm_date))
        .attr("y1", "100%")
        .attr("y2", "0%");

      ytd_total = Number(
        d3.max(
          ytd_data.filter((d) => d.year == current_year),
          (d) => d.cum_sum
        )
      ).toLocaleString();

      rank = tidy(
        ytd_data,
        filter(
          (d) =>
            d.norm_date.getFullYear() === ytd.getFullYear() &&
            d.norm_date.getMonth() === ytd.getMonth() &&
            d.norm_date.getDate() === ytd.getDate()
        ),
        arrange(desc("cum_sum")),
        mutate({ ytd_rank: (_, i) => i + 1 })
      );

      var summary_text =
        "The <span style='color: #1db954; font-weight: 1000';>" +
        ytd_total +
        "</span> albums so far this year, ranks no. <span style='color: #1db954; font-weight: 1000';>" +
        rank.filter((d) => d.year === current_year)[0]["ytd_rank"] +
        "</span> compared to previous years";

      // Update heading sub text
      d3.select("#stats-1-text")
        .append("h2")
        .attr("id", "stats-1-sub-text")
        .html(summary_text);
    }
  }

  // Update based on option selected
  d3.selectAll('input[name="albums-year"]').on("change", function () {
    if (this.checked) {
      transition_period(this.value);
    }
  });
});
