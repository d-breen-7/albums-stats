var dy_margins = { top: 0, right: 0, bottom: 0, left: 75 };

var sub_text_rd = d3.select("#release-decade-text").append("h2");

var dy_sub_heading = `Over time, albums released <span style='color: #ffffff; font-weight: 1000; 
background-color: #1db954;border-radius: 5px;'> &nbsp&nbsp pre-2010 &nbsp&nbsp</span> have been making up a higher proportion of my total 
album listens. In 2020, these albums made up just <span style='color: #1db954; font-weight:1000'>7.2%</span> of my album listens. 
In 2025, this number has increased to <span style='color: #1db954; font-weight:1000'>37.5%</span>. A big proportion of the
albums I listen to are still those which were released from <span style=' color: #121212; font-weight: 1000; background-color:
#9df7bd; border-radius: 5px;'> &nbsp&nbsp 2010 onwards &nbsp&nbsp</span>. Given that I am now listening to less albums, and trying to listen to more older 
albums, the changes in proportions are not surprising.`;

sub_text_rd.html(dy_sub_heading);

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/release-decade"
).then(function (response) {
  let data = response.data;

  const decades = [
    "",
    ...Object.keys(data[0])
      .filter((key) => key.startsWith("d"))
      .map((key) => key.substring(1)),
  ];

  // Create tiles for each listen year
  const dashboard = d3.select("#release-decade-image");

  data.forEach((yearData, index) => {
    const tile = dashboard
      .append("div")
      .attr("class", "release-decade-tile")
      .attr("id", "release-decade-tile-" + index);
  });

  data.forEach((yearData, index) => {
    const tile = d3.select("#release-decade-tile-" + index);

    // Define layout dimensions
    let tile_width = d3.select("#release-decade-tile-0").node().offsetWidth;

    tile
      .append("div")
      .attr("class", "release-decade-title")
      .text(yearData.listen_year);

    let release_decade_svg_id = "release-decade-svg-" + yearData.listen_year;
    const release_decade_svg = tile
      .append("svg")
      .attr("class", "release-decade-svg")
      .attr("id", release_decade_svg_id)
      .attr("width", tile_width - 10);
    const release_decade_svg_height = parseFloat(
      release_decade_svg.style("height")
    );

    let bar_start_x = 60,
      bar_width = tile_width - bar_start_x - (bar_start_x - bar_start_x / 2),
      row_height = release_decade_svg_height / (decades.length + 2);

    // Calculate total listens
    let pre_total = 0;
    let post_total = 0;

    Object.keys(yearData).forEach((key) => {
      if (key.startsWith("d")) {
        const decade = Number(key.slice(1)); // extract the number e.g. "d2010" -> 2010

        if (decade < 2010) {
          pre_total += yearData[key];
        } else {
          post_total += yearData[key];
        }
      }
    });

    // Add decade backgrounds and labels
    decades.forEach((decade, i) => {
      const y = i * row_height;

      // Decade background
      release_decade_svg
        .append("rect")
        .attr("class", "release-decade-bar-bg")
        .attr("x", bar_start_x)
        .attr("y", y + 4)
        .attr("width", bar_width)
        .attr("height", row_height - 8);

      release_decade_svg
        .append("text")
        .attr("class", "release-decalde-label")
        .attr("x", bar_start_x - bar_start_x)
        .attr("y", y + row_height / 2 + 4)
        .attr("fill", "#121212") //decade == "" ? "#121212" : "#a9a9a9")
        .attr("font-weight", decade == "" ? "bolder" : "normal")
        .text(decade == "" ? "Overall" : index === 0 ? decade + "s" : "");
    });

    // Vertical grid lines
    const gridPercents = d3.range(0, 120, 20);

    gridPercents.forEach((p) => {
      const x = bar_start_x + (p / 100) * bar_width;

      release_decade_svg
        .append("line")
        .attr("class", "release-decade-gridline")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 25)
        .attr("y2", decades.length * row_height + 20);
    });

    // Add labels
    gridPercents.forEach((p) => {
      const x = bar_start_x + (p / 100) * bar_width;

      release_decade_svg
        .append("text")
        .attr("class", "release-decade-grid-label")
        .attr("x", x)
        .attr("y", release_decade_svg_height - row_height / 2)
        .attr("text-anchor", "middle")
        .text(p + "%");
    });
    // }

    // Add data bars
    let cumulative = 0;

    decades.forEach((decade, i) => {
      const value = yearData["d" + decade];
      const y = i * row_height;

      if (decade === "") {
        const bar_width_pre = (pre_total / 100) * bar_width;
        const bar_width_post = (post_total / 100) * bar_width;

        // Pre-2010 total bar
        release_decade_svg
          .append("rect")
          .attr("class", "release-decade-bar release-decade-bar-comp")
          .attr("x", bar_start_x)
          .attr("y", y + 4)
          .attr("width", bar_width_pre)
          .attr("height", row_height - 8)
          .attr("fill", "#1db954");

        // Post-2010 total bar
        release_decade_svg
          .append("rect")
          .attr("class", "release-decade-bar release-decade-bar-comp")
          .attr("x", bar_start_x + bar_width_pre)
          .attr("y", y + 4)
          .attr("width", bar_width_post)
          .attr("height", row_height - 8)
          .attr("fill", "#9df7bd");

        // release_decade_svg
        //   .append("text")
        //   .attr("class", "release-decade-comp-label")
        //   .attr("x", bar_start_x)
        //   .attr("y", row_height * 0.75)
        //   .attr("text-anchor", "start")
        //   .attr("fill", "#1db954")
        //   .text(Number(pre_total).toFixed(1) + "%");

        // release_decade_svg
        //   .append("text")
        //   .attr("class", "release-decade-comp-label")
        //   .attr("x", bar_start_x + bar_width)
        //   .attr("y", row_height * 0.75)
        //   .attr("text-anchor", "end")
        //   .attr("fill", "#a9a9a9")
        //   .text(Number(post_total).toFixed(1) + "%");
      }

      if (value > 0) {
        const barX = bar_start_x + (cumulative / 100) * bar_width;
        const bar_width_ = (value / 100) * bar_width;

        // Color based on
        release_decade_svg
          .append("rect")
          .attr("class", "release-decade-bar")
          .attr("x", barX)
          .attr("y", y + 4)
          .attr("width", bar_width_)
          .attr("height", row_height - 8)
          .attr("fill", decade.slice(0, 3) > 200 ? "#9df7bd" : "#1db954");

        cumulative += value;
      }
    });
  });
});
