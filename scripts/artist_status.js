const parseDate = d3.timeParse("%Y-%m-%d");

d3.json(
  // "data/artist_level.json"
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/artist-stats",
).then(function (data) {
  let _overview_data = data.data;

  // Overview of all listens
  let overview_data = tidy(
    _overview_data,
    mutate({
      year: (d) => d.listen_date.slice(0, 4),
    }),
    arrange((d) => d.listen_date),
  );

  var max_total = tidy(overview_data, max("avg_total"));

  let _years_in_data = tidy(
    overview_data,
    distinct([(d) => d.year]),
    select(["year"]),
  );

  let years_in_data = _years_in_data;

  let release_texture = textures
      .lines()
      .stroke("#76e99f")
      .background("#1db954")
      .thicker(),
    new_artists_texture = textures
      .lines()
      .orientation("diagonal")
      .size(20)
      .strokeWidth(1)
      .shapeRendering("crispEdges")
      .background("#1db954")
      .stroke("#9df7bd");

  const overview_text = `Despite the number of albums I have listened to, I am still consistently finding new artists 
    to listen to. The overview below shows the 7-day rolling average for all albums and albums by new artists. The first 
    time I listen to an artist (first album by an artist, features are not considered) the album will be shown in the new data, 
    any subsequent albums by the artist are shown as part of the total.`;

  const artist_overview_text = `After selecting an artist, all album listens related to the artist are shown. This data includes
    albums by the artist, and albums that the artist features on. Each listen can be selected to get more details about the 
    specific album. The album image can also be clicked to open the album in Spotify.
    <br><span style='color: #a9a9a9'>Album meta source: Spotify.</span>`;

  d3.select("#artist-text")
    .append("h2")
    .attr("id", "artist-text-desc")
    .html(overview_text);

  const dashboard = d3.select("#artist-image");

  function drawOverview() {
    years_in_data
      .map((d) => d.year)
      .forEach((year, index) => {
        var year_data = overview_data.filter((d) => d.year === year);

        const tile = dashboard
          .append("div")
          .attr("class", "artists-tile")
          .attr("id", "artist-tile-" + year);

        tile.append("div").attr("class", "tile-title").text(year);

        tile
          .append("svg")
          .attr("id", "svg-main-" + year)
          .attr("class", "artist-year-svg");

        const svg_overview = d3.select("#svg-main-" + year);

        var svg_width = parseInt(svg_overview.style("width")),
          svg_height = parseInt(svg_overview.style("height")) - 10,
          album_radius = svg_height / 5 / 2,
          scale_x = scale_x_history(
            year,
            album_radius + 2,
            svg_width - (album_radius + 2),
          ),
          scale_y_total = scale_y_history(max_total, svg_height, 0);

        let months = d3.timeMonths(
          parseDate(year + "-01-01"),
          parseDate(+year + 1 + "-01-01"),
        );

        svg_overview
          .append("g")
          .attr("class", "month-grid")
          .selectAll("line")
          .data(months)
          .enter()
          .append("line")
          .attr("x1", (d) => scale_x(d))
          .attr("x2", (d) => scale_x(d))
          .attr("y1", 0)
          .attr("y2", svg_height);

        let horizontalGridTicks = d3.range(
          0,
          Math.ceil(max_total / 2) * 2 + 1,
          2,
        );

        // Gridlines
        svg_overview
          .append("g")
          .attr("class", "month-grid")
          .selectAll("line")
          .data(horizontalGridTicks)
          .enter()
          .append("line")
          .attr("id", (d) => (d === 0 ? "" : "y-axis-grid"))
          .attr("x1", album_radius + 2)
          .attr("x2", svg_width - album_radius + 2)
          .attr("y1", (d) => scale_y_total(d))
          .attr("y2", (d) => scale_y_total(d));

        const area_total_avg = d3
          .area()
          .x((d) => scale_x(parseDate(d.listen_date)))
          .y0(scale_y_total(0))
          .y1((d) => scale_y_total(+d.avg_total))
          .curve(d3.curveMonotoneX);

        const line_total_avg = d3
          .line()
          .x((d) => scale_x(parseDate(d.listen_date)))
          .y((d) => scale_y_total(+d.avg_total))
          .curve(d3.curveMonotoneX);

        svg_overview
          .append("path")
          .datum(year_data)
          .attr("id", "overview")
          .attr("fill", "#9df7bd")
          .attr("d", area_total_avg);

        svg_overview
          .append("path")
          .datum(year_data)
          .attr("id", "overview")
          .attr("fill", "none")
          .attr("stroke", "#1db954")
          .attr("stroke-width", 1.5)
          .attr("d", line_total_avg);

        const area_existing_avg = d3
          .area()
          .x((d) => scale_x(parseDate(d.listen_date)))
          .y0(scale_y_total(0))
          .y1((d) => scale_y_total(+d.avg_new))
          .curve(d3.curveMonotoneX);

        const line_existing_avg = d3
          .line()
          .x((d) => scale_x(parseDate(d.listen_date)))
          .y((d) => scale_y_total(+d.avg_new))
          .curve(d3.curveMonotoneX);

        svg_overview.call(new_artists_texture);

        svg_overview
          .append("path")
          .datum(year_data)
          .attr("id", "overview")
          .attr("fill", new_artists_texture.url())
          .attr("d", area_existing_avg);

        svg_overview
          .append("path")
          .datum(year_data)
          .attr("id", "overview")
          .attr("fill", "none")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.75)
          .attr("d", line_existing_avg);

        if (index === 0) {
          const legend_data = [
            { listen_date: "2019-01-01", avg_new: 1, avg_total: 2.75 },
            { listen_date: "2019-02-01", avg_new: 1.7, avg_total: 4.2 },
            { listen_date: "2019-03-01", avg_new: 2.575, avg_total: 4.75 },
            { listen_date: "2019-04-01", avg_new: 2.725, avg_total: 6.125 },
            { listen_date: "2019-05-01", avg_new: 4.725, avg_total: 8 },
            { listen_date: "2019-06-01", avg_new: 5.225, avg_total: 8.5 },
            { listen_date: "2019-07-20", avg_new: 5.7, avg_total: 8.7 },
          ];

          const svg_overview = d3.selectAll("#overview-legend-div");

          const svg_width = svg_overview.node().offsetWidth;
          const svg_height = (svg_overview.node().offsetHeight - 20) / 1.5;
          const album_radius = (svg_overview.node().offsetHeight - 20) / 5 / 2;

          const scale_x = scale_x_history(
            year,
            album_radius + 2,
            svg_width - (album_radius + 2),
          );

          const scale_y_total = scale_y_history(max_total, svg_height, 0);

          // Create SVG
          const legend_svg = d3
            .select("#overview-legend-div")
            .append("svg")
            .attr("id", "overview-legend-svg")
            .attr("width", svg_width)
            .attr("height", svg_height + 22);

          // Grid ticks
          const horizontalTicks = d3.range(
            0,
            Math.ceil(max_total / 2) * 2 + 1,
            2,
          );

          const hGrid = legend_svg.append("g").attr("class", "month-grid");

          hGrid
            .selectAll("line")
            .data(horizontalTicks)
            .enter()
            .append("line")
            .attr("x1", album_radius + 2)
            .attr("x2", scale_x(parseDate("2019-07-20")))
            .attr("y1", (d) => scale_y_total(d))
            .attr("y2", (d) => scale_y_total(d));

          hGrid
            .selectAll("text")
            .data(horizontalTicks)
            .enter()
            .append("text")
            .attr("class", "x-axis")
            .attr("x", scale_x(parseDate("2019-01-01")) - 15)
            .attr("y", (d) => scale_y_total(d) + 5)
            .text((d) => d);

          // X axis
          const x_axis = d3
            .axisBottom(scale_x)
            .ticks(12)
            .tickFormat(d3.timeFormat("%b"));

          legend_svg
            .append("g")
            .attr("class", "x-axis")
            .style("text-anchor", "start")
            .attr("transform", `translate(0,${svg_height - 8})`)
            .call(x_axis);

          // Month grid
          const months = d3.timeMonths(
            parseDate(`${year}-01-01`),
            parseDate(`${year}-08-01`),
          );

          legend_svg
            .append("g")
            .attr("class", "month-grid")
            .selectAll("line")
            .data(months)
            .enter()
            .append("line")
            .attr("x1", (d) => scale_x(d))
            .attr("x2", (d) => scale_x(d))
            .attr("y1", 0)
            .attr("y2", svg_height);

          svg_overview
            .append("g")
            .attr("class", "month-grid")
            .selectAll("line")
            .data(months)
            .enter()
            .append("line")
            .attr("x1", (d) => scale_x(d))
            .attr("x2", (d) => scale_x(d))
            .attr("y1", 0)
            .attr("y2", svg_height);

          legend_svg.call(new_artists_texture);

          // Area + line generators
          const areaTotal = d3
            .area()
            .x((d) => scale_x(parseDate(d.listen_date)))
            .y0(scale_y_total(0))
            .y1((d) => scale_y_total(+d.avg_total))
            .curve(d3.curveMonotoneX);

          const lineTotal = d3
            .line()
            .x((d) => scale_x(parseDate(d.listen_date)))
            .y((d) => scale_y_total(+d.avg_total))
            .curve(d3.curveMonotoneX);

          legend_svg
            .append("g")
            .append("path")
            .attr("id", "overview")
            .datum(legend_data)
            .attr("fill", "#9df7bd")
            .attr("opacity", 1)
            .attr("d", areaTotal);

          legend_svg
            .append("path")
            .attr("id", "overview")
            .datum(legend_data)
            .attr("fill", "none")
            .attr("stroke", "#1db954")
            .attr("stroke-width", 1.5)
            .attr("d", lineTotal);

          // New artists
          const areaNew = d3
            .area()
            .x((d) => scale_x(parseDate(d.listen_date)))
            .y0(scale_y_total(0))
            .y1((d) => scale_y_total(+d.avg_new))
            .curve(d3.curveMonotoneX);

          const lineNew = d3
            .line()
            .x((d) => scale_x(parseDate(d.listen_date)))
            .y((d) => scale_y_total(+d.avg_new))
            .curve(d3.curveMonotoneX);

          legend_svg.call(new_artists_texture);

          legend_svg
            .append("g")
            .append("path")
            .attr("id", "overview")
            .datum(legend_data)
            .attr("fill", new_artists_texture.url())
            .attr("opacity", 1)
            .attr("d", areaNew);

          legend_svg
            .append("path")
            .attr("id", "overview")
            .datum(legend_data)
            .attr("fill", "none")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.75)
            .attr("d", lineNew);

          legend_svg
            .append("rect")
            .attr("id", "overview")
            .attr("fill", "#ffffff")
            .attr("x", scale_x(parseDate("2019-08-01")))
            .attr("y", 0)
            .attr("width", "250px")
            .attr("height", svg_height + 50);

          // Labels
          legend_svg
            .append("text")
            .attr("id", "overview")
            .attr("x", scale_x(parseDate("2019-07-22")))
            .attr("y", 30)
            .text("All albums")
            .attr("fill", "#1db954")
            .attr("font-weight", 1000)
            .attr("font-size", "18px")
            .attr("text-anchor", "start");

          legend_svg
            .append("text")
            .attr("id", "overview")
            .attr("x", scale_x(parseDate("2019-07-22")))
            .attr("y", 85)
            .text("By new artists")
            .attr("fill", "#1db954")
            .attr("font-weight", 1000)
            .attr("font-size", "18px")
            .attr("text-anchor", "start");
        }
      });
  }

  function drawArtist(artist) {
    if (artist === "0") {
      // Update text
      d3.select("#artist-title-text").html(
        "Average Albums Per Day by Artist Status",
      );
      d3.select("#artist-text-desc").html(overview_text);

      // Show overview
      d3.selectAll("#overview").attr("class", "overview-show");
      d3.select("#legend").attr("class", "legend-show");
      d3.selectAll("#y-axis-grid").attr("display", "block");

      // Remove artist info
      d3.selectAll(".album-play").remove();
      d3.selectAll(".album-release").remove();

      // Remove any album being highlighted
      d3.select("#album-container").attr(
        "class",
        "album-container album-container-hide",
      );
      d3.selectAll("#album-image").remove();
      d3.selectAll(".album-artist-title").text("");
      d3.selectAll(".album-artist-info").text("");
      d3.selectAll(".album-artist-plays").text("");
      d3.select("#album-src").attr("class", "album-src-image album-src-hide");

      years_in_data
        .map((d) => d.year)
        .forEach((year, index) => {
          // Format year div based on number of albums
          d3.selectAll("#artist-tile-" + year).attr("class", "artists-tile");
        });
    } else {
      let artist_data = albums_data.filter((d) => d.artist_name === artist),
        albums_meta = artist_data[0].albums,
        _album_plays = artist_data[0].played,
        _artist_feats = artist_data[0].features,
        _feat_plays = [];

      // Update summary text
      // Update text
      d3.select("#artist-title-text").html(`Artist Listen History - ${artist}`);
      d3.select("#artist-text-desc").html(artist_overview_text);

      // Remove other artist elements
      d3.selectAll(".album-play").remove();
      d3.selectAll(".album-release").remove();
      d3.selectAll("#overview").attr("class", "overview-hide");
      d3.select("#legend").attr("class", "legend-hide");
      d3.selectAll("#album-image").remove();
      d3.selectAll(".album-artist-title").text("");
      d3.selectAll(".album-artist-info").text("");
      d3.selectAll(".album-artist-plays").text("");
      d3.selectAll("#y-axis-grid").attr("display", "none");

      // Show album card
      d3.select("#album-container").attr(
        "class",
        "album-container album-container-show",
      );
      d3.select("#album-src").attr("class", "album-src-image album-src-hide");

      let album_plays = tidy(
        _album_plays,
        mutate({
          year: (d) => d.listen_date.slice(0, 4),
        }),
        arrange("listen_date"),
      );

      let artist_feats = tidy(
        _artist_feats,
        filter((d) => !albums_meta.map((a) => a.album_id).includes(d.album_id)),
        arrange(["artist_id", "album_release"]),
      );

      let artist_albums = tidy(albums_meta, arrange("album_release"));

      artist_feats.forEach((d) => d.plays.forEach((d) => _feat_plays.push(d)));

      let feat_plays = tidy(
        _feat_plays,
        filter((d) => !album_plays.map((a) => a.album_id).includes(d.album_id)),
        mutate({
          year: (d) => d.listen_date.slice(0, 4),
          play_code: 5,
        }),
      );

      let _all_artist_plays = [...feat_plays, ...album_plays];

      let all_artist_plays = tidy(
        _all_artist_plays,
        arrange(desc("play_code"), "listen_date"),
      );

      years_in_data
        .map((d) => d.year)
        .forEach((year, index) => {
          let svg_id = "#svg-main-" + year;

          var svg_width = parseInt(d3.select(svg_id).style("width")),
            svg_height = parseInt(d3.select(svg_id).style("height")) - 10,
            album_radius = svg_height / 5 / 2,
            day_width = svg_width / days_in_year(year);

          var scale_x = scale_x_history(
              year,
              album_radius + 2,
              svg_width - (album_radius + 2),
            ),
            year_plays = tidy(
              all_artist_plays,
              filter((d) => d.year === year),
              arrange("listen_date"),
            ),
            year_releases = artist_albums.filter(
              (d) => d.album_release.slice(0, 4) === year,
            ),
            albums_for_year = tidy(year_plays, distinct(["album_id"]));

          // Format year div based on number of albums
          d3.selectAll("#artist-tile-" + year).attr(
            "class",
            albums_for_year.length === 0
              ? "artists-tile artists-tile-none"
              : "artists-tile artists-tile-data",
          );

          d3.select(svg_id).call(release_texture);

          // Add album releases
          d3.select(svg_id)
            .append("g")
            .selectAll("g")
            .data(year_releases)
            .enter()
            .append("rect")
            .attr("class", "album-release")
            .attr("id", "album-release")
            .attr(
              "x",
              (d) => scale_x(parseDate(d.album_release)) - day_width / 2,
            )
            .attr("y", 0)
            .attr("width", day_width)
            .attr("height", svg_height)
            .style("fill", release_texture.url());

          // Add album plays
          d3.select(svg_id)
            .append("g")
            .selectAll("g")
            .data(year_plays)
            .enter()
            .append("circle")
            .attr("class", (d) => "album-play album-play-" + d.play_code)
            .attr("id", (d) => d.album_id)
            .attr("cx", (d) => scale_x(parseDate(d.listen_date)))
            .attr(
              "cy",
              (d) =>
                svg_height -
                0.5 +
                album_radius -
                album_cy(year_plays, d.album_id, d.listen_date) *
                  album_radius *
                  2,
            )
            .attr("r", album_radius)
            .on("click", function (d, i) {
              if (d.play_code === 5) {
                // Getting album meta data for features
                feat_artist_data = albums_data.find((artist) =>
                  artist.albums.some((album) => album.album_id === d.album_id),
                );

                feat_albums_meta = feat_artist_data.albums;
                album_data = feat_albums_meta.filter(
                  (e) => e.album_id === d.album_id,
                )[0];
              } else {
                album_data = albums_meta.filter(
                  (e) => d.album_id === e.album_id,
                )[0];
              }

              // Show Spotify as source
              d3.select("#album-src").attr(
                "class",
                "album-src-image album-src-show",
              );

              // Remove existing
              d3.select("#album-image").remove();

              // Add album image
              d3.select(".album-artist-image")
                .append("a")
                .attr("id", "album-image")
                .attr("href", album_data.album_url)
                .append("div")
                .append("img")
                .attr("src", album_data.album_cover)
                .attr("width", "100%")
                .attr("height", "100%");

              // Add album info
              // Album name
              d3.select(".album-artist-title").text(
                album_data.album_name.length < 26
                  ? album_data.album_name
                  : album_data.album_name.slice(0, 26) + "...",
              );
              // Info
              release_date = d3.timeFormat("%-d %b %y")(
                parseDate(album_data.album_release),
              );
              d3.select(".album-artist-info").html(
                `${album_data.album_tracks} tracks <span style='font-weight:1000;'>|</span> ${release_date}`,
              );
              // Album plays
              num_plays = album_plays.filter(
                (e) => e.album_id === d.album_id,
              ).length;
              d3.select(".album-artist-plays").html(
                num_plays <= 1
                  ? ""
                  : `<span style='color:#1db954; font-weight:1000;'>${num_plays} listens</span>`,
              );
            });
        });
    }
  }

  drawOverview();
  draw_artist_legend();

  d3.select("#select-artist").on("change", function () {
    var selected_artist = d3.select(this).property("value");
    drawArtist(selected_artist);
  });
  hideLoader("artist");
});
