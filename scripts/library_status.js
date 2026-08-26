var library_margins = { top: 20, right: 20, bottom: 30, left: 60 },
    parse_date = d3.timeParse("%Y-%m-%d");

d3.json("https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/library-stats",
    // d3.json("..//data//library_duration_data.json"
)
    .then(function (response) {

        let is_panning = false;
        let current_x_scale;

        let library_img_width = d3.select("#library-image").node().offsetWidth,
            library_img_height = d3.select("#library-image").node().offsetHeight;

        const data = tidy(response.daily_data, mutate({ date: d => parse_date(d.date) }))

        const stats = response.current_stats;

        const date_range = d3.extent(data, d => d.date);
        const max_date = date_range[1];
        const default_start = d3.timeMonth.offset(max_date, -1); // Update to 3 when more data
        const highlight_period = d3.timeDay.offset(max_date, -13); //
        const y_max_limit = Math.ceil(d3.max(data, (d) => +d.total_albums));
        const day_ticks = d3.range(0, y_max_limit + 1);

        // Stats
        // Albums
        d3.select("#albums-current").html(`${stats.total_albums}<span class='label'> in total</span>`);
        d3.select("#albums-current-new").html(`${stats.by_new_artist}<span class='label'> by new artists</span)`);
        d3.select("#albums-added").text(stats.recent_n_added);
        d3.select("#albums-removed").text(stats.recent_n_dropped);

        d3.select("#albums-change")
            .text(stats.recent_n_change < 0 ? `-${Math.abs(stats.recent_n_change)}` : `+${stats.recent_n_change}`)
            .style("color", stats.recent_n_change < 0 ? "red" : "#1db954");


        // Runtime
        d3.select("#runtime-current").text(format_milliseconds(stats.total_duration));
        d3.select("#runtime-added").text(format_milliseconds(stats.recent_d_added));
        d3.select("#runtime-removed").text(format_milliseconds(stats.recent_d_dropped));

        d3.select("#runtime-change")
            .text(stats.recent_d_change < 0 ?
                `-${format_milliseconds(Math.abs(stats.recent_d_change))}`
                : `+ ${format_milliseconds(stats.recent_d_change)
                } `)
            .style("color", stats.recent_d_change < 0 ? "red" : "#1db954");


        // Calculate the precise inner width of the chart grid canvas
        const chart_inner_width = library_img_width - library_margins.left - library_margins.right - 45;

        // Define SVG
        var library_svg = d3
            .select("#library-image")
            .append("svg")
            .attr("id", "library-svg")
            .attr("width", library_img_width)
            .attr("height", library_img_height);

        // Initial x scale
        var library_x = d3
            .scaleTime()
            .domain(date_range)
            .range([
                library_margins.left,
                library_margins.left + chart_inner_width
            ]);

        // Reference scale for tracking 
        var library_x_orig = d3
            .scaleTime()
            .domain(date_range)
            .range([
                library_margins.left,
                library_margins.left + chart_inner_width
            ]);

        current_x_scale = library_x;

        var library_x_axis = d3
            .axisBottom(library_x)
            .tickSize(-(library_img_height - library_margins.top - library_margins.bottom))
            .tickPadding(10)
            .ticks(d3.timeMonth.every(1))
            .tickFormat(d3.timeFormat("%b %y"));

        var g_x = library_svg
            .append("g")
            .attr("class", "x-axis")
            .attr(
                "transform",
                "translate(0," + (library_img_height - library_margins.bottom) + ")",
            )
            .call(library_x_axis);

        // Define Y axis
        var library_y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => +d.total_albums)])
            .range([
                library_img_height - library_margins.bottom,
                library_margins.top + 25
            ]);

        var library_y_axis = d3
            .axisLeft()
            .scale(library_y)
            .ticks(y_max_limit / 50)
            .tickPadding(35)
            .tickSize(-chart_inner_width);

        library_svg
            .append("g")
            .attr("class", "y-axis")
            .attr("transform", "translate(" + (library_margins.left) + ", 0)")
            .call(library_y_axis);

        // SVG clip path
        library_svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("x", library_margins.left)
            .attr("y", library_margins.top + 2.5)
            .attr("width", chart_inner_width) // Expand clip right
            .attr("height", library_img_height - library_margins.top - library_margins.bottom + 5);

        // Clip-path restricted group container
        var plot_area = library_svg.append("g")
            .attr("clip-path", "url(#clip)");

        // Recent period highlighted background rect
        var recent_rect = plot_area
            .append("rect")
            .attr("y", library_margins.top)
            .attr("height", library_img_height - library_margins.top - library_margins.bottom)
            .style("fill", "#1db954")
            .attr("x", library_x(highlight_period))
            .attr("width", library_x(max_date) - library_x(highlight_period))
            .style("opacity", 0.1);

        var library_line = d3
            .line()
            .x((d) => library_x(d.date))
            .y((d) => library_y(d.total_albums))
            .curve(d3.curveMonotoneX);

        var trendline = plot_area
            .append("path")
            .data([data])
            .attr("class", "library-trendline")
            .attr("d", library_line);

        var current_line = plot_area
            .append("line")
            .attr("x1", (d) => library_x(date_range[0]))
            .attr("x2", (d) => library_x(max_date))
            .attr("y1", library_y(stats.total_albums))
            .attr("y2", library_y(stats.total_albums))
            .style("stroke-width", "2px")
            .style("stroke", "#1db954")
            .style("stroke-dasharray", "5    5")
            .style("opacity", 0.75);

        // Current total
        library_svg
            .append("text")
            .attr("x", library_x(max_date) + 20)
            .attr("y", library_y(stats.total_albums) - 7.5)
            .style("text-anchor", "middle")
            .style("alignment-baseline", "middle")
            .style("font-weight", 600)
            .style("font-size", "18px")
            .style("fill", "#1db954")
            .text(stats.total_albums);

        // By new artist
        library_svg
            .append("text")
            .attr("x", library_x(max_date) + 20)
            .attr("y", library_y(stats.by_new_artist) - 7.5)
            .style("text-anchor", "middle")
            .style("alignment-baseline", "middle")
            .style("font-weight", 600)
            .style("font-size", "18px")
            .style("fill", "#1db954")
            .text(stats.total_albums - stats.by_new_artist < 30 ? "" : stats.by_new_artist < 10 ? "" : stats.by_new_artist);

        // By new artist bar
        let new_artist_texture = textures
            .lines()
            .stroke("#1db954")
            .background("#76e99f")
            .thicker()
            .shapeRendering("crispEdges");

        library_svg.call(new_artist_texture);

        library_svg
            .append("rect")
            .attr("x", library_x(max_date))
            .attr("y", library_y(stats.total_albums) - 0.5)
            .attr("height", library_y(0) - library_y(stats.total_albums))
            .attr("width", 40)
            .attr("stroke", "#1db954")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("opacity", 1);

        library_svg
            .append("rect")
            .attr("x", library_x(max_date))
            .attr("y", library_y(stats.by_new_artist))
            .attr("height", library_y(0) - library_y(stats.by_new_artist))
            .attr("width", 40)
            .attr("stroke", "#1db954")
            .attr("stroke-width", 2)
            .style("fill", new_artist_texture.url())
            .attr("opacity", 1);

        // Crosshairs
        var bisect_date = d3.bisector(function (d) { return d.date; }).left;

        var crosshair_g = library_svg.append("g")
            .attr("class", "crosshair-group")
            .style("pointer-events", "none");

        var vertical = crosshair_g.append("line")
            .attr("y1", library_margins.top)
            .attr("y2", library_img_height - library_margins.bottom)
            .attr("stroke", "#121212")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var horizontal = crosshair_g.append("line")
            .attr("x1", library_margins.left)
            .attr("x2", library_margins.left + chart_inner_width)
            .attr("stroke", "#121212")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var horizontal_label_bg = crosshair_g.append("rect")
            .attr("fill", "#ffffff")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var horizontal_label = crosshair_g.append("text")
            .attr("x", library_margins.left + 2.5)
            .attr("dy", "-6px")
            .attr("fill", "#121212")
            .style("font-size", "18px")
            .style("text-anchor", "start")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Stacking baseline parameters
        var date_y = library_margins.top - 7;
        var metrics_y = library_margins.top + 15;

        var vertical_label_bg = crosshair_g.append("rect")
            .attr("fill", "white")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var vertical_label = crosshair_g.append("text")
            .attr("y", date_y)
            .attr("fill", "#121212")
            .style("font-size", "18px")
            .style("pointer-events", "none")
            .style("text-anchor", "middle")
            .style("opacity", 0);

        // Recent rect label
        var rect_label_bg = plot_area.append("rect")
            .attr("fill", "#E8F8EE")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .attr("x", library_x(highlight_period) + 2.5)
            .attr("y", library_img_height - library_margins.bottom - 20)
            .attr("width", 107.5)
            .attr("height", 20);

        var recent_label = plot_area
            .append("text")
            .attr("x", library_x(highlight_period) + 5)
            .attr("y", library_img_height - library_margins.bottom - 5)
            .style("alignment-baseline", "top")
            .style("font-weight", 600)
            .style("font-size", "14px")
            .style("fill", "#1db954")
            .style("text-transform", "uppercase")
            .text("last 2 weeks");

        // Metric Backgrounds
        var added_label_bg = crosshair_g.append("rect")
            .attr("fill", "white")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var dropped_label_bg = crosshair_g.append("rect")
            .attr("fill", "white")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Metric Text labels
        var added_label = crosshair_g.append("text")
            .attr("fill", "#1db954")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var dropped_label = crosshair_g.append("text")
            .attr("fill", "#e91429")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Helper layout clear command
        function hide_crosshairs() {
            if (!vertical) return; // Guard clause during early rendering phase
            vertical.style("opacity", 0);
            horizontal.style("opacity", 0);
            horizontal_label.style("opacity", 0);
            horizontal_label_bg.style("opacity", 0);
            vertical_label.style("opacity", 0);
            vertical_label_bg.style("opacity", 0);
            rect_label_bg.style("opacity", 0);
            recent_label.style("opqacity", 0);
            added_label.style("opacity", 0);
            added_label_bg.style("opacity", 0);
            dropped_label.style("opacity", 0);
            dropped_label_bg.style("opacity", 0);
        }

        // Zoom setup parameters
        const total_days = d3.timeDay.count(date_range[0], max_date);
        const default_days = ((max_date - default_start) / 86000000)

        var zoom = d3.zoom()
            .scaleExtent([1, total_days / default_days])
            .extent([[library_margins.left, 0], [library_margins.left + chart_inner_width, library_img_height]])
            .translateExtent([[library_x_orig(date_range[0]), -Infinity], [library_x_orig(max_date), Infinity]])
            .on("zoom", zoomed);

        // Transparent overlay panel 
        var zoom_pane = library_svg.append("rect")
            .attr("width", chart_inner_width)
            .attr("height", library_img_height - library_margins.top - library_margins.bottom)
            .attr("transform", `translate(${library_margins.left}, ${library_margins.top})`)
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(zoom);

        // Compute initial matrix transform to force view viewport down into the target recent window
        const full_timeline_width = library_x_orig(max_date) - library_x_orig(date_range[0]);
        const single_month_width = library_x_orig(max_date) - library_x_orig(default_start); // Changed highlight_period to default_start

        const initial_scale = full_timeline_width / single_month_width;
        const initial_transform = d3.zoomIdentity
            .scale(initial_scale)
            .translate(-library_x_orig(default_start) + (library_margins.left / initial_scale), 0); // Changed highlight_period to default_start

        zoom_pane.call(zoom.transform, initial_transform);

        // Crosshair interactions
        zoom_pane
            .on("mousemove", function () {
                // Instantly exit if chart is actively sliding or scaling
                if (is_panning) {
                    hide_crosshairs();
                    return;
                }

                // Fetch precise coordinates relative to the active target panel
                var mouse = d3.mouse(this);
                var mousex = mouse[0] + library_margins.left;
                var mousey = mouse[1] + library_margins.top;

                var minx = library_margins.left;
                var maxx = library_margins.left + chart_inner_width;
                var miny = library_margins.top;
                var maxy = library_img_height - library_margins.bottom;

                // Ensure cursor is strictly within the chart plotting canvas area
                if (mousex >= minx && mousex <= maxx && mousey >= miny && mousey <= maxy) {
                    var active_scale = current_x_scale || library_x;
                    var hovered_date = active_scale.invert(mousex);
                    var i = bisect_date(data, hovered_date, 1);

                    if (i >= data.length) { i = data.length - 1; }

                    var d0 = data[i - 1];
                    var d1 = data[i];
                    var d = d1;

                    if (d0 && d1) {
                        d = hovered_date - parse_date(d0.date) > parse_date(d1.date) - hovered_date ? d1 : d0;
                    }

                    if (d) {
                        var snapped_value = +d.total_albums;
                        var snappedy = library_y(snapped_value);

                        var snappedx = active_scale(d.date);

                        rect_label_bg.style("opacity", 1);

                        vertical
                            .style("opacity", 1)
                            .attr("x1", snappedx)
                            .attr("x2", snappedx);

                        horizontal
                            .style("opacity", 1)
                            .attr("y1", snappedy)
                            .attr("y2", snappedy);

                        horizontal_label
                            .style("opacity", 1)
                            .attr("y", snappedy)
                            .text(d3.format(",.0f")(snapped_value));

                        horizontal_label_bg
                            .attr("x", library_margins.left + 2.5)
                            .attr("y", snappedy - 22)
                            .attr("width", 30)
                            .attr("height", 20)
                            .style("opacity", 1);

                        vertical_label
                            .style("opacity", 1)
                            .attr("x", snappedx)
                            .text(d3.timeFormat("%b %_d")(d.date));

                        vertical_label_bg
                            .attr("x", snappedx - 30)
                            .attr("y", date_y - 14)
                            .attr("width", 60)
                            .attr("height", 18)
                            .style("opacity", 1);

                        // Added removed / labels
                        var added_val = +d.added_today || 0;
                        var dropped_val = +d.dropped_today || 0;

                        added_label
                            .style("text-anchor", "end")
                            .attr("x", snappedx - 6)
                            .attr("y", metrics_y)
                            .text("+ " + added_val)
                            .style("opacity", added_val > 0 ? 1 : 0);

                        added_label_bg
                            .attr("x", snappedx - 41)
                            .attr("y", metrics_y - 14)
                            .attr("width", 40)
                            .attr("height", 16)
                            .style("opacity", added_val > 0 ? 1 : 0);

                        dropped_label
                            .style("text-anchor", "start")
                            .attr("x", snappedx + 6)
                            .attr("y", metrics_y)
                            .text("- " + dropped_val)
                            .style("opacity", dropped_val > 0 ? 1 : 0);

                        dropped_label_bg
                            .attr("x", snappedx + 1)
                            .attr("y", metrics_y - 14)
                            .attr("width", 40)
                            .attr("height", 16)
                            .style("opacity", dropped_val > 0 ? 1 : 0);
                    }
                } else {
                    hide_crosshairs();
                }
            })
            .on("mouseleave", hide_crosshairs);

        // Zoom redrawing
        function zoomed() {
            if (!library_x_orig) return;

            is_panning = true;

            var new_x = d3.event.transform.rescaleX(library_x_orig);
            current_x_scale = new_x;

            hide_crosshairs();

            // Update axis
            g_x.call(library_x_axis.scale(new_x));

            // Update trendline
            library_line.x((d) => new_x(d.date));
            trendline.attr("d", library_line);

            // Update recent highlight rect
            recent_rect
                .attr("x", new_x(highlight_period))
                .attr("width", new_x(max_date) - new_x(highlight_period));

            // Update recent
            recent_label.attr("x", new_x(highlight_period) + 5);
            rect_label_bg.attr("x", new_x(highlight_period) + 2.5);

            clearTimeout(window.zoom_panelTimeout);
            window.zoom_panelTimeout = setTimeout(function () {
                is_panning = false;
            }, 80);
        }

        hideLoader("library");

    });