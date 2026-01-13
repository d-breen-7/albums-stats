var overview_margins = { top: 20, right: 60, bottom: 30, left: 10 },
  current_year = new Date().getFullYear(),
  norm_year = current_year;
parse_date = d3.timeParse("%Y-%m-%d");

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
          norm_year,
          parse_date(d.date).getMonth(),
          parse_date(d.date).getDate()
        ),
    })
  );

  var unique_albums = Number(response.unique).toLocaleString();

  const overview_summary_text = `
  An overview of my album listens since the start of 2019. During 2019, I mostly listened
  to new releases before starting to consciously listen to more albums in 2020. 
  After excluding relistens, which are included below, I have listened to 
  <span style='color: #1db954; font-weight: 1000'>~${unique_albums}</span> unique albums.
  <br><span style='color: #a9a9a9'>2019 starts at 116 to account for some albums where I 
  don't have the exact listen date.</span>`;
  // An overview of all the albums I have listened to since the start of 2019. \
  // I started to consciously listen to more albums at the start of 2020. \

  // Add heading sub text
  d3.select("#overview-title")
    .append("h1")
    .attr("id", "overview-title-text")
    .html("Cumulative Album Listens Since 2019");

  d3.select("#overview-text")
    .append("h2")
    .attr("id", "overview-text-desc")
    .html(overview_summary_text);

  // TODO: update logic backend
  res_data[0].day_albums = 0;

  var data = group_by_year(res_data),
    total_albums = Number(
      d3.max(data, (d) => d.cumulative_albums)
    ).toLocaleString();

  // Dynamically radio buttons for each year + all time + ytd
  const years = Array.from(new Set(data.map((d) => +d.year))).sort(
    (a, b) => b - a
  );

  const radio_options = [
    { value: "all-time", label: "All" },
    ...years.map((y) => ({ value: y, label: y })),
    { value: "ytd", label: "YTD" },
  ];

  const radio_container = d3.select("#overview-listen-years");

  const items = radio_container
    .selectAll("div")
    .data(radio_options)
    .enter()
    .append("div");

  items
    .append("input")
    .attr("type", "radio")
    .attr("name", "albums-year")
    .attr("id", (d) => d.value)
    .attr("value", (d) => d.value)
    .property("checked", (d) => d.value === "all-time");

  items
    .append("label")
    .attr("for", (d) => d.value)
    .text((d) => d.label);

  let overview_img_width = d3.select("#overview-image").node().offsetWidth,
    overview_img_height = d3.select("#overview-image").node().offsetHeight;

  // Define SVG
  var overview_svg = d3
    .select("#overview-image")
    .append("svg")
    .attr("id", "overview-svg")
    .attr("viewBox", [0, 0, overview_img_width, overview_img_height]);

  // Define X axis
  var overview_x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => parse_date(d.date)))
    .range([
      overview_margins.left,
      overview_img_width - overview_margins.right,
    ]);

  var overview_x_axis = d3
    .axisBottom(overview_x)
    .ticks(d3.timeYear)
    .tickPadding(10)
    .tickSize(-overview_img_height)
    .tickPadding(10);

  overview_svg
    .append("g")
    .attr("class", "x-axis")
    .attr(
      "transform",
      "translate(0," + (overview_img_height - overview_margins.bottom) + ")"
    )
    .call(overview_x_axis);

  // Define Y axis
  var overview_y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d.cumulative_albums + 5)])
    .range([
      overview_img_height - overview_margins.bottom,
      overview_margins.top,
    ]);

  var overview_y_axis = d3
    .axisRight()
    .scale(overview_y)
    .ticks(d3.max(data, (d) => +d.cumulative_albums) / 1000)
    .tickSize(
      overview_img_width - overview_margins.left - overview_margins.right
    )
    .tickFormat((d) => Number(d).toLocaleString());

  overview_svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", "translate(" + overview_margins.left + ", 0)")
    .call(overview_y_axis);

  // Albums area
  var overview_area = d3
    .area()
    .x((d) => overview_x(parse_date(d.date)))
    .y0(overview_y(0))
    .y1((d) => overview_y(d.cumulative_albums));

  overview_svg
    .append("path")
    .data([data])
    .attr("class", "overview-area")
    .attr("d", overview_area);

  // Albums line
  var overview_line = d3
    .line()
    .x((d) => overview_x(parse_date(d.date)))
    .y((d) => overview_y(d.cumulative_albums));

  overview_svg
    .append("path")
    .data([data])
    .attr("class", "overview-line-all")
    .attr("d", overview_line);

  // Text for total
  overview_svg
    .append("text")
    .attr("class", "overview-today-text")
    .attr("id", "overview-today-text")
    .attr("x", overview_x(d3.max(data, (d) => parse_date(d.date))))
    .attr("y", overview_y(d3.max(data, (d) => d.cumulative_albums)) - 7.5)
    .text(Number(d3.max(data, (d) => d.cumulative_albums)).toLocaleString())
    .attr("alignment-baseline", "middle");

  function transition_period(period) {
    // Remove existing elements
    d3.select("#overview-title-text").remove();
    d3.select("#overview-text-desc").remove();
    d3.select("#overview-today-text").remove();
    d3.selectAll("#overview-ytd-text").remove();
    d3.selectAll("#overview-year-lines").remove();
    d3.selectAll(".overview-line-all").remove();
    d3.selectAll(".overview-line-current").remove();
    d3.selectAll(".overview-line-old").remove();
    d3.selectAll(".overview-area").remove();
    d3.selectAll("#clip").remove();

    if (period !== "ytd") {
      // Logic for specific years/all time
      var period_data =
          period === "all-time" ? data : data.filter((d) => d.year == period),
        period_total =
          period === "all-time"
            ? d3.max(period_data, (d) => +d.cumulative_albums)
            : d3.max(period_data, (d) => +d.cum_sum);

      // Update X axis
      var overview_x = d3
        .scaleTime()
        .domain(d3.extent(period_data, (d) => parse_date(d.date)))
        .range([
          overview_margins.left,
          overview_img_width - overview_margins.right,
        ]);

      var overview_x_axis =
        period === "all-time"
          ? d3
              .axisBottom(overview_x)
              .ticks(d3.timeYear)
              .tickSize(-overview_img_height)
              .tickPadding(10)
          : d3
              .axisBottom(overview_x)
              .tickSize(-overview_img_height)
              .ticks(d3.timeMonth)
              .tickPadding(10)
              .tickFormat(d3.timeFormat("%b"));

      overview_svg
        .select(".x-axis")
        .transition()
        .duration(1000)
        .attr(
          "transform",
          "translate(0," + (overview_img_height - overview_margins.bottom) + ")"
        )
        .call(overview_x_axis);

      // Update Y axis
      var overview_y = d3
        .scaleLinear()
        .domain([0, period_total])
        .range([
          overview_img_height - overview_margins.bottom,
          overview_margins.top,
        ]);

      var overview_y_axis = d3
        .axisRight()
        .scale(overview_y)
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
        .tickSize(
          overview_img_width - overview_margins.left - overview_margins.right
        )
        .tickFormat((d) => Number(d).toLocaleString());

      overview_svg
        .select(".y-axis")
        .transition()
        .duration(1000)
        .attr("transform", "translate(" + overview_margins.left + ", 0)")
        .call(overview_y_axis);

      // Update Area
      var overview_area =
        period == "all-time"
          ? d3
              .area()
              .x((d) => overview_x(parse_date(d.date)))
              .y0(overview_y(0))
              .y1((d) => overview_y(d.cumulative_albums))
          : d3
              .area()
              .x((d) => overview_x(parse_date(d.date)))
              .y0(overview_y(0))
              .y1((d) => overview_y(d.cum_sum));

      // Define a clipPath
      overview_svg
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", 0)
        .attr("height", "100%");

      overview_svg
        .append("path")
        .attr("class", "overview-area")
        .data([period_data])
        .attr("d", overview_area)
        .attr("clip-path", "url(#clip)");

      overview_svg
        .select("#clip rect")
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr("width", overview_img_width);

      // Update Line
      var overview_line = d3
        .line()
        .x((d) => overview_x(parse_date(d.date)))
        .y((d) =>
          overview_y(period === "all-time" ? d.cumulative_albums : d.cum_sum)
        );

      var new_line = overview_svg
        .append("path")
        .data([period_data])
        .attr("class", "overview-line-all")
        .attr("d", overview_line);

      total_length = new_line.node().getTotalLength();

      new_line
        .attr("stroke-dasharray", total_length + " " + total_length)
        .attr("stroke-dashoffset", total_length)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Update heading sub text
      let total_num = Number(period_total).toLocaleString();
      var summary_text =
        period == "all-time"
          ? overview_summary_text
          : period == current_year
          ? `So far this year, I have listened to <span style='color: #1db954; font-weight: 1000';>${total_num}</span> albums (including listens).`
          : `In ${period}, I listened to <span style='color: #1db954; font-weight: 1000';>${total_num}</span> albums (including listens).`;

      // Add h1, h2 title
      d3.select("#overview-title")
        .append("h1")
        .attr("id", "overview-title-text")
        .html(
          period === "all-time"
            ? "Cumulative Album Listens Since 2019"
            : "All Album Listens During " + period
        );

      d3.select("#overview-text")
        .append("h2")
        .attr("id", "overview-text-desc")
        .html(summary_text);

      // Update total text
      overview_svg
        .append("text")
        .attr("class", "overview-today-text")
        .attr("id", "overview-today-text")
        .attr("x", overview_x(d3.max(period_data, (d) => parse_date(d.date))))
        .attr("y", overview_y(period_total) - 7.5)
        .text("")
        .transition()
        .delay(1000)
        .text(Number(period_total).toLocaleString())
        .attr("alignment-baseline", "middle");
    } else {
      // Logic for when ytd selected
      var ytd = d3.max(
        data.filter((d) => d.year == norm_year),
        (d) => d.norm_date
      );

      ytd_data = data.filter((d) => d.norm_date <= ytd);

      ytd_data
        .filter((d) => d.day == 1 && d.month === 0)
        .forEach((d) => (d.cum_sum = 0)); // added month condition

      // Update X axis
      var overview_x = d3
        .scaleTime()
        .domain(
          d3.extent(
            ytd_data.filter((d) => d.year == norm_year),
            (d) => d.norm_date
          )
        )
        .range([
          overview_margins.left,
          overview_img_width - overview_margins.right,
        ]);

      var overview_x_axis = d3
        .axisBottom(overview_x)
        .ticks(d3.timeMonth)
        .tickSize(-overview_img_height)
        .tickPadding(10)
        .tickFormat(d3.timeFormat("%b"));

      overview_svg
        .select(".x-axis")
        .transition()
        .duration(1000)
        .attr(
          "transform",
          "translate(0," + (overview_img_height - overview_margins.bottom) + ")"
        )
        .call(overview_x_axis);

      // Update Y axis
      period_total = d3.max(ytd_data, (d) => +d.cum_sum);

      var overview_y = d3
        .scaleLinear()
        .domain([0, period_total])
        .range([
          overview_img_height - overview_margins.bottom,
          overview_margins.top,
        ]);

      var axis_shift = period_total < 10 ? 15 : period_total < 100 ? 30 : 50;

      var overview_y_axis = d3
        .axisLeft()
        .scale(overview_y)
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
        .tickSize(
          -overview_img_width +
            overview_margins.left +
            overview_margins.right +
            axis_shift
        )
        .tickPadding(axis_shift)
        .tickFormat((d) => (d == 0 ? "" : Number(d).toLocaleString()));

      overview_svg
        .select(".y-axis")
        .transition()
        .duration(1000)
        .attr(
          "transform",
          "translate(" + (overview_margins.left + axis_shift) + ", 0)"
        )
        .call(overview_y_axis);

      // Step 1: Group all rows by year
      const groups = ytd_data.reduce((acc, row) => {
        const year = row.year;
        if (!acc[year]) acc[year] = [];
        acc[year].push(row);
        return acc;
      }, {});

      // Step 2: Pick the row with maximum cum_sum per year
      const maxRowsPerYear = Object.values(groups).map((rows) => {
        return rows.reduce((maxRow, row) => {
          return row.cum_sum > maxRow.cum_sum ? row : maxRow;
        }, rows[0]);
      });

      // Step 3: Sort by cum_sum descending
      maxRowsPerYear.sort((a, b) => b.cum_sum - a.cum_sum);

      // Step 4: Add rank
      const rank = maxRowsPerYear.map((row, i) => ({
        ...row,
        ytd_rank: i + 1,
      }));

      // Loop through each year of data
      d3.set(ytd_data.map((d) => d.year))
        .values()
        .forEach((year, i) => {
          // Draw line
          var overview_line = d3
            .line()
            .x((d) => overview_x(d.norm_date))
            .y((d) => overview_y(d.cum_sum));

          var new_line = overview_svg
            .append("path")
            .data([ytd_data.filter((d) => d.year == year)])
            .attr("class", "overview-line-all")
            .attr("d", overview_line);

          total_length = new_line.node().getTotalLength();

          // Add year line
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
              year == current_year
                ? "overview-line-current"
                : "overview-line-old"
            );

          // Year label
          overview_svg
            .append("text")
            .attr("class", "overview-ytd-text")
            .attr("id", "overview-ytd-text")
            .attr(
              "y",
              overview_y(
                d3.max(
                  ytd_data.filter((d) => d.year == year),
                  (d) => d.cum_sum
                )
              )
            )
            .attr("x", overview_x(d3.max(ytd_data, (d) => d.norm_date)))
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
              year == current_year
                ? "overview-ytd-text"
                : "overview-ytd-text-old"
            );
        });

      ytd_total = Number(
        d3.max(
          ytd_data.filter((d) => d.year == current_year),
          (d) => d.cum_sum
        )
      ).toLocaleString();

      var rank_num = rank.filter((d) => d.year === current_year)[0]["ytd_rank"];

      var summary_text = `My album listening peaked in 2021 and has been declining ever since. 
        This reflects a change in my listening habits as I spend more time discovering new music.
        I mostly listen to albums while working and listen to things like internet radio shows 
        and mixes while exercising, reading etc.
        The <span style='color: #1db954; font-weight: 1000';>${ytd_total}</span> albums so far this year ranks
        <span style='color: #1db954; font-weight: 1000';>#${rank_num}</span> compared to previous years.`;

      // Update h1, h2 text
      d3.select("#overview-title")
        .append("h1")
        .attr("id", "overview-title-text")
        .html("Cumulative Album Listens Year-to-Date");

      d3.select("#overview-text")
        .append("h2")
        .attr("id", "overview-text-desc")
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
