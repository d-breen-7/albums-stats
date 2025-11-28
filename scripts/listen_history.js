d3.json("data/listenHistory.json", function (data) {
  let _overview = data.overview,
    dropdown = data.dropdown,
    albumsData = data.data,
    favourites = data.favourite;

  let overview = tidy(
    _overview,
    mutate({
      year: (d) => d.date.slice(0, 4),
    })
  );

  var d = 0,
    albums = [];

  // Need to return object of albums only
  for (var d = 0; d < albumsData.length; d++) {
    var artistAlbums = albumsData[d].albums;
    var a = 0;
    for (var a = 0; a < artistAlbums.length; a++) {
      albums.push(artistAlbums[a]);
    }
  }

  let YEARS = tidy(overview, distinct([(d) => d.year]), select(["year"]));

  let color = d3
    .scaleLinear()
    .domain([0, 10, 16])
    .range(["#eeeeee", "#76e99f", "#1db954"]);

  let dropdown_names = d3
    .map(dropdown, function (d) {
      return d.artist_name;
    })
    .sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

  let today = String(new Date().toISOString().slice(0, 10));

  let last_entry = overview[overview.length - 1].date,
    albums_today =
      last_entry === today
        ? overview.filter((d) => d.date === today)[0].albums
        : 0,
    total_today = albums_today === undefined ? 0 : albums_today,
    albums_today_text = total_today === 1 ? "album today" : "albums today";

  d3.select("#select-artist")
    .selectAll("options")
    .data(dropdown_names)
    .enter()
    .append("option")
    .text(function (d) {
      return d;
    })
    .attr("value", function (d) {
      return d;
    });

  let release_texture = textures
    .lines()
    .stroke("#76e99f")
    .background("#1db954")
    .thicker();

  function drawOverview() {
    d3.select("#listen-history")
      .selectAll("div")
      .data(YEARS)
      .enter()
      .append("div")
      .attr("class", "history-year-container")
      .attr("id", (d, i) => "history-" + d.year);

    d3.select(".history-year-container")
      .append("div")
      .attr("class", "listen-history")
      .text("Listen History");

    YEARS.map((d) => d.year).forEach((year, index) => {
      let year_data = overview.filter((d) => d.year === year),
        year_selector = "#history-" + year;

      let year_summary = tidy(
        year_data,
        summarize({
          total: sum("albums"),
          max: max("albums"),
          days: tally("albums"),
        })
      )[0];

      let daily_average = (year_summary.total / year_summary.days[0].n).toFixed(
        1
      );

      let max_times = tidy(
        year_data,
        filter((d) => d.albums === year_summary.max)
      ).length;

      let max_info =
        max_times > 1
          ? Math.floor(year_summary.max) + " (x" + max_times + ")"
          : Math.floor(year_summary.max);

      let zero_days = tidy(
        year_data,
        filter((d) => d.albums === 0)
      ).length;

      let w_ = d3.select(year_selector).node().offsetWidth,
        h_ = 100,
        s_ = w_ / days_in_year(year);

      let scale_x = scale_x_history(year, w_),
        scale_y = scale_y_history(16, h_),
        scale_h = scale_h_history(16, h_);

      d3.select(year_selector)
        .append("div")
        .attr("class", "history-year")
        .text(year);

      var svg = d3
        .select(year_selector)
        .append("div")
        .attr("class", "history-year-svg")
        .append("svg")
        .attr("viewBox", [0, 0, w_, index === YEARS.length - 1 ? h_ + 40 : h_])
        .attr("id", "history-year-svg-" + year);

      svg
        .append("g")
        .selectAll("rect")
        .data(year_data.filter((d) => +d.albums > 0))
        .enter()
        .append("rect")
        .attr("class", "history-strip-back")
        .attr("id", "history-strip-back-" + year)
        .attr("x", (d) => scale_x(d3.timeParse("%Y-%m-%d")(d.date)))
        .attr("y", (d) => scale_y(8 + d.albums / 2))
        .attr("height", (d) => scale_h(+d.albums))
        .attr("width", s_ - 0.5)
        .attr("rx", 0.75)
        .attr("opacity", 1)
        .attr("fill", (d) => "#1db954");

      svg
        .append("g")
        .selectAll("rect")
        .data(year_data.filter((d) => +d.albums > 0))
        .enter()
        .append("rect")
        .attr("class", "history-strip-mask")
        .attr("id", "history-strip-mask-" + year)
        .attr("x", (d) => scale_x(d3.timeParse("%Y-%m-%d")(d.date)))
        .attr("y", (d) => scale_y(8 + d.albums / 2 - 0.3))
        .attr("height", (d) => scale_h(+d.albums - 0.6))
        .attr("width", s_ - 0.5)
        .attr("fill", "#ffffff")
        .attr("opacity", 1);

      svg
        .append("g")
        .selectAll("rect")
        .data(year_data.filter((d) => +d.albums > 0))
        .enter()
        .append("rect")
        .attr("class", "history-strip-main")
        .attr("id", "history-strip-main-" + year)
        .attr("x", (d) => scale_x(d3.timeParse("%Y-%m-%d")(d.date)))
        .attr("y", (d) => scale_y(8 + d.albums / 2 - 0.3))
        .attr("height", (d) => scale_h(+d.albums - 0.6))
        .attr("width", s_ - 0.5)
        .attr("fill", (d) =>
          d.date === today
            ? "#1db954"
            : +d.albums === 0
            ? "white"
            : color(+d.albums)
        )
        .attr("opacity", (d) => (d.date === today ? 1 : 0.85));

      if (index === YEARS.length - 1) {
        let x_axis = d3
          .axisBottom()
          .scale(scale_x)
          .ticks(12)
          .tickFormat(d3.timeFormat("%b"));

        svg
          .append("g")
          .attr("class", "history-x-axis")
          .style("text-anchor", "start")
          .attr("transform", "translate(0," + (h_ + 15) + ")")
          .call(x_axis);

        svg
          .append("text")
          .attr("class", "today-stats-number")
          .attr("id", "today-stats-number")
          .attr("x", scale_x(d3.timeParse("%Y-%m-%d")(today)) + s_ / 2 + 10)
          .attr("y", 10)
          .text(total_today)
          .attr("alignment-baseline", "middle")
          .attr(
            "text-anchor",
            scale_x(d3.timeParse("%Y-%m-%d")(today)) > 1000 ? "end" : "middle"
          );

        svg
          .append("text")
          .attr("class", "today-stats")
          .attr("id", "today-stats")
          .attr("x", scale_x(d3.timeParse("%Y-%m-%d")(today)) + 1.4 + 10)
          .attr("y", 20)
          .text(albums_today_text)
          .attr("alignment-baseline", "middle")
          .attr("text-anchor", "end")
          .attr("transform", function (d) {
            let x_point = scale_x(d3.timeParse("%Y-%m-%d")(today)) + 1.4 + 10,
              y_point = 20;
            return "rotate(" + 270 + ", " + x_point + ", " + y_point + ")";
          });
      }
    });
  }

  function drawArtist(artist) {
    if (artist === "0") {
      d3.selectAll("#album-play").remove();
      d3.selectAll(".history-albums").remove();
      d3.selectAll(".album-release").remove();
      d3.select("#albums-detail-name-1").text("Favourite Albums");
      d3.select("#albums-detail-name-2").text("Oldest Albums");

      overview_stats(overview, YEARS);

      YEARS.map((d) => d.year).forEach((year, index) => {
        year_selector = "#history-" + year;

        let w_ = d3.select(year_selector).node().offsetWidth,
          h_ = 100;

        let scale_y = scale_y_history(16, h_),
          scale_h = scale_h_history(16, h_);

        d3.select(year_selector)
          .selectAll(".history-strip-back")
          .transition()
          .attr("y", (d) => scale_y(8 + d.albums / 2))
          .attr("height", (d) => scale_h(+d.albums))
          .attr("opacity", 1);

        d3.select(year_selector)
          .selectAll(".history-strip-mask")
          .transition()
          .attr("y", (d) => scale_y(8 + d.albums / 2 - 0.3))
          .attr("height", (d) => scale_h(+d.albums - 0.6))
          .attr("opacity", 1);

        d3.select(year_selector)
          .selectAll(".history-strip-main")
          .transition()
          .attr("y", (d) => scale_y(8 + d.albums / 2 - 0.3))
          .attr("height", (d) => scale_h(+d.albums - 0.6))
          .attr("opacity", (d) => (d.date === today ? 1 : 0.85));
      });
    } else {
      let artist_data = albumsData.filter((d) => d.artist_name === artist),
        _artist_albums = artist_data[0].albums,
        _album_plays = artist_data[0].played,
        _artist_feats = artist_data[0].features,
        _feat_plays = [];

      d3.selectAll("#album-play").remove();
      d3.selectAll(".history-albums").remove();
      d3.selectAll(".album-release").remove();
      d3.select("#albums-detail-name-1").text("Artist Albums");
      d3.select("#albums-detail-name-2").text("Features On");

      let album_plays = tidy(
        _album_plays,
        mutate({
          year: (d) => d.listen_date.slice(0, 4),
        }),
        arrange("listen_date")
      );

      let artist_feats = tidy(
        _artist_feats,
        filter(
          (d) => !_artist_albums.map((a) => a.album_id).includes(d.album_id)
        ),
        arrange(["artist_id", "album_release"])
      );

      let artist_albums = tidy(_artist_albums, arrange("album_release"));

      artist_feats.forEach((d) => d.plays.forEach((d) => _feat_plays.push(d)));

      let feat_plays = tidy(
        _feat_plays,
        filter((d) => !album_plays.map((a) => a.album_id).includes(d.album_id)),
        mutate({
          year: (d) => d.listen_date.slice(0, 4),
          play_code: 5,
        })
      );

      let _all_artist_plays = [...feat_plays, ...album_plays];

      let all_artist_plays = tidy(
        _all_artist_plays,
        arrange(desc("play_code"), "listen_date")
      );

      album_slider("#slider-1", artist_albums);
      album_slider("#slider-2", artist_feats);

      let last_listen = album_plays[album_plays.length - 1].listen_date,
        last_listen_gap = last_listen_days(
          d3.timeParse("%Y-%m-%d")(last_listen)
        );
      listen_gap_text = "last listen";

      d3.select("#today-stats-number").text(
        Number(last_listen_gap).toLocaleString()
      );
      d3.select("#today-stats").text(listen_gap_text);

      YEARS.map((d) => d.year).forEach((year, index) => {
        let year_selector = "#history-" + year,
          svg_id = "#history-year-svg-" + year;

        let w_ = d3.select(year_selector).node().offsetWidth,
          h_ = 100,
          s_ = w_ / days_in_year(year);

        let scale_x = scale_x_history(year, w_),
          R = 10;

        year_plays = all_artist_plays.filter((d) => d.year === year);
        year_releases = artist_albums.filter(
          (d) => d.album_release.slice(0, 4) === year
        );

        year_num_albums = tidy(
          year_plays,
          filter((d) => d.play_code !== 5),
          distinct(["album_id"])
        );

        year_num_listens = tidy(
          year_plays,
          filter((d) => d.play_code !== 5),
          distinct(["album_id", "listen_date"])
        );

        year_num_tracks = tidy(
          year_plays,
          filter((d) => d.play_code !== 5),
          distinct(["album_id"]),
          leftJoin(albums, { by: ["album_id", "album_id"] }),
          summarize({
            total: sum("album_tracks"),
          })
        )[0];

        year_num_feats = tidy(
          year_plays,
          filter((d) => d.play_code === 5),
          arrange(["listen_date", "album_id"]),
          distinct(["album_id", "listen_date"])
        );

        d3.select(year_selector)
          .select("#history-stats-1")
          .text(year_num_albums.length);

        d3.select(year_selector)
          .select("#history-stats-2")
          .text(year_num_listens.length);

        d3.select(year_selector)
          .select("#history-stats-3")
          .text(year_num_tracks.total);

        d3.select(year_selector)
          .select("#history-stats-4")
          .text(year_num_feats.length);

        d3.select(year_selector).select(svg_id).call(release_texture);

        d3.select(year_selector)
          .select(svg_id)
          .append("g")
          .selectAll("g")
          .data(year_releases)
          .enter()
          .append("rect")
          .attr("class", "album-release")
          .attr("id", "album-release")
          .attr("x", (d) => scale_x(d3.timeParse("%Y-%m-%d")(d.album_release)))
          .attr("y", 0)
          .attr("width", s_ - 0.5)
          .attr("height", h_)
          .style("fill", release_texture.url());

        d3.select(year_selector)
          .select(svg_id)
          .append("g")
          .selectAll("g")
          .data(year_plays)
          .enter()
          .append("circle")
          .attr("class", (d) => "album-play-" + d.play_code)
          .attr("id", (d) => "album-play")
          .attr(
            "cx",
            (d) => scale_x(d3.timeParse("%Y-%m-%d")(d.listen_date)) + s_ / 2
          )
          .attr(
            "cy",
            (d) =>
              h_ -
              0.5 +
              R -
              album_cy(year_plays, d.album_id, d.listen_date) * R * 2
          )
          .attr("r", R);
      });

      d3.selectAll("rect.history-strip-main")
        .transition()
        .attr("y", 0)
        .attr("height", 100)
        .attr("opacity", 0.2);

      d3.selectAll("rect.history-strip-back")
        .transition()
        .attr("y", 0)
        .attr("height", 100)
        .attr("opacity", 0.2);

      d3.selectAll("rect.history-strip-mask")
        .transition()
        .attr("y", 0)
        .attr("height", 100)
        .attr("opacity", 0.2);
    }
  }

  drawOverview();

  d3.select("#select-artist").on("change", function (d) {
    var selected_artist = d3.select(this).property("value");
    drawArtist(selected_artist);
  });
});
