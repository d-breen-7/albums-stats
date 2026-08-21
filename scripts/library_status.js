var library_margins = { top: 20, right: 10, bottom: 30, left: 60 },
    parse_date = d3.timeParse("%Y-%m-%d");

d3.json("https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/library-stats",
)
    .then(function (response) {

        let is_panning = false;
        let current_x_scale;

        let library_img_width = d3.select("#library-image").node().offsetWidth,
            library_img_height = d3.select("#library-image").node().offsetHeight;

        const data = response.daily_data;
        const stats = response.current_stats;

        const date_range = d3.extent(data, d => parse_date(d.date));
        const max_date = date_range[1];
        const default_start = d3.timeMonth.offset(max_date, -1); // Update to 3 when more data
        const highlight_period = d3.timeDay.offset(max_date, -13); //
        const y_max_limit = Math.ceil(d3.max(data, (d) => +d.total_albums));
        const day_ticks = d3.range(0, y_max_limit + 1);

        // Stats
        // Albums
        d3.select("#albums-current").text(stats.total_albums);
        d3.select("#albums-added").text(stats.recent_n_added);
        d3.select("#albums-removed").text(stats.recent_n_dropped);

        d3.select("#albums-change")
            .text(stats.recent_n_change < 0 ? "- " + Math.abs(stats.recent_n_change) : "+" + stats.recent_n_change)
            .style("color", stats.recent_n_change < 0 ? "red" : "#16a34a");


        // Runtime
        d3.select("#runtime-current").text(format_milliseconds(stats.total_duration));
        d3.select("#runtime-added").text(format_milliseconds(stats.recent_d_added));
        d3.select("#runtime-removed").text(format_milliseconds(stats.recent_d_dropped));

        d3.select("#runtime-change")
            .text(stats.recent_d_change < 0 ? "- " + format_milliseconds(Math.abs(stats.recent_d_change)) : "+" + format_milliseconds(stats.recent_d_change))
            .style("color", stats.recent_d_change < 0 ? "red" : "#16a34a");


        // Calculate the precise inner width of the chart grid canvas
        const chartInnerWidth = library_img_width - library_margins.left - library_margins.right - 45;

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
                library_margins.left + chartInnerWidth
            ]);

        // Reference scale for tracking 
        var library_x_orig = d3
            .scaleTime()
            .domain([date_range[0], max_date])
            .range([
                library_margins.left,
                library_margins.left + chartInnerWidth
            ]);

        current_x_scale = library_x;

        var library_x_axis = d3
            .axisBottom(library_x)
            .tickSize(-(library_img_height - library_margins.top - library_margins.bottom))
            .tickPadding(10)
            .ticks(d3.timeMonth.every(1))
            .tickFormat(d3.timeFormat("%b %y"));

        var gX = library_svg
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
            .tickSize(-chartInnerWidth);

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
            .attr("width", chartInnerWidth) // Expand clip right
            .attr("height", library_img_height - library_margins.top - library_margins.bottom + 5);

        // Clip-path restricted group container
        var plotArea = library_svg.append("g")
            .attr("clip-path", "url(#clip)");

        // Recent period highlighted background rect
        var recentRect = plotArea
            .append("rect")
            .attr("y", library_margins.top)
            .attr("height", library_img_height - library_margins.top - library_margins.bottom)
            .style("fill", "#1db954")
            .attr("x", library_x(highlight_period))
            .attr("width", library_x(max_date) - library_x(highlight_period))
            .style("opacity", 0.1);

        var library_line = d3
            .line()
            .x((d) => library_x(parse_date(d.date)))
            .y((d) => library_y(d.total_albums))
            .curve(d3.curveMonotoneX);

        var trendline = plotArea
            .append("path")
            .data([data])
            .attr("class", "library-trendline")
            .attr("d", library_line);

        var current_line = plotArea
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
            .attr("x", library_x(max_date) + 2)
            .attr("y", library_y(stats.total_albums))
            .style("text-anchor", "start")
            .style("alignment-baseline", "middle")
            .style("font-weight", 600)
            .style("font-size", "18px")
            .style("fill", "#1db954")
            .text(stats.total_albums);


        // Crosshairs
        var bisectDate = d3.bisector(function (d) { return parse_date(d.date); }).left;

        var crosshairG = library_svg.append("g")
            .attr("class", "crosshair-group")
            .style("pointer-events", "none");

        var vertical = crosshairG.append("line")
            .attr("y1", library_margins.top)
            .attr("y2", library_img_height - library_margins.bottom)
            .attr("stroke", "#121212")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var horizontal = crosshairG.append("line")
            .attr("x1", library_margins.left)
            .attr("x2", library_margins.left + chartInnerWidth)
            .attr("stroke", "#121212")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var horizontalLabelBg = crosshairG.append("rect")
            .attr("fill", "#ffffff")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var horizontalLabel = crosshairG.append("text")
            .attr("x", library_margins.left + 2.5)
            .attr("dy", "-6px")
            .attr("fill", "#121212")
            .style("font-size", "18px")
            .style("text-anchor", "start")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Stacking baseline parameters
        var dateY = library_margins.top - 7;
        var metricsY = library_margins.top + 15;

        var verticalLabelBg = crosshairG.append("rect")
            .attr("fill", "white")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var verticalLabel = crosshairG.append("text")
            .attr("y", dateY)
            .attr("fill", "#121212")
            .style("font-size", "18px")
            .style("pointer-events", "none")
            .style("text-anchor", "middle")
            .style("opacity", 0);

        // Metric Backgrounds
        var addedLabelBg = crosshairG.append("rect")
            .attr("fill", "white")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var droppedLabelBg = crosshairG.append("rect")
            .attr("fill", "white")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Metric Text labels
        var addedLabel = crosshairG.append("text")
            .attr("fill", "#1db954")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("opacity", 0);

        var droppedLabel = crosshairG.append("text")
            .attr("fill", "#e91429")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("opacity", 0);

        // Helper layout clear command
        function hideCrosshairs() {
            if (!vertical) return; // Guard clause during early rendering phase
            vertical.style("opacity", 0);
            horizontal.style("opacity", 0);
            horizontalLabel.style("opacity", 0);
            horizontalLabelBg.style("opacity", 0);
            verticalLabel.style("opacity", 0);
            verticalLabelBg.style("opacity", 0);
            addedLabel.style("opacity", 0);
            addedLabelBg.style("opacity", 0);
            droppedLabel.style("opacity", 0);
            droppedLabelBg.style("opacity", 0);
        }

        // Zoom setup parameters
        const totalDays = d3.timeDay.count(date_range[0], max_date);
        const default_days = ((max_date - default_start) / 86000000)

        var zoom = d3.zoom()
            .scaleExtent([1, totalDays / default_days])
            .extent([[library_margins.left, 0], [library_margins.left + chartInnerWidth, library_img_height]])
            .translateExtent([[library_x_orig(date_range[0]), -Infinity], [library_x_orig(max_date), Infinity]])
            .on("zoom", zoomed);

        // Transparent overlay panel 
        var zoomPane = library_svg.append("rect")
            .attr("width", chartInnerWidth)
            .attr("height", library_img_height - library_margins.top - library_margins.bottom)
            .attr("transform", `translate(${library_margins.left}, ${library_margins.top})`)
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(zoom);

        // Compute initial matrix transform to force view viewport down into the target recent window
        const fullTimelineWidth = library_x_orig(max_date) - library_x_orig(date_range[0]);
        const singleMonthWidth = library_x_orig(max_date) - library_x_orig(default_start); // Changed highlight_period to default_start

        const initialScale = fullTimelineWidth / singleMonthWidth;
        const initialTransform = d3.zoomIdentity
            .scale(initialScale)
            .translate(-library_x_orig(default_start) + (library_margins.left / initialScale), 0); // Changed highlight_period to default_start

        zoomPane.call(zoom.transform, initialTransform);

        // Crosshair interactions
        zoomPane
            .on("mousemove", function () {
                // Instantly exit if chart is actively sliding or scaling
                if (is_panning) {
                    hideCrosshairs();
                    return;
                }

                // Fetch precise coordinates relative to the active target panel
                var mouse = d3.mouse(this);
                var mousex = mouse[0] + library_margins.left;
                var mousey = mouse[1] + library_margins.top;

                var minX = library_margins.left;
                var maxX = library_margins.left + chartInnerWidth;
                var minY = library_margins.top;
                var maxY = library_img_height - library_margins.bottom;

                // Ensure cursor is strictly within the chart plotting canvas area
                if (mousex >= minX && mousex <= maxX && mousey >= minY && mousey <= maxY) {
                    var activeScale = current_x_scale || library_x;
                    var hoveredDate = activeScale.invert(mousex);
                    var i = bisectDate(data, hoveredDate, 1);

                    if (i >= data.length) { i = data.length - 1; }

                    var d0 = data[i - 1];
                    var d1 = data[i];
                    var d = d1;

                    if (d0 && d1) {
                        d = hoveredDate - parse_date(d0.date) > parse_date(d1.date) - hoveredDate ? d1 : d0;
                    }

                    if (d) {
                        var snappedValue = +d.total_albums;
                        var snappedY = library_y(snappedValue);

                        vertical
                            .style("opacity", 1)
                            .attr("x1", mousex)
                            .attr("x2", mousex);

                        horizontal
                            .style("opacity", 1)
                            .attr("y1", snappedY)
                            .attr("y2", snappedY);

                        horizontalLabel
                            .style("opacity", 1)
                            .attr("y", snappedY)
                            .text(d3.format(",.0f")(snappedValue));

                        horizontalLabelBg
                            .attr("x", library_margins.left + 2.5)
                            .attr("y", snappedY - 22)
                            .attr("width", 30)
                            .attr("height", 20)
                            .style("opacity", 1);

                        verticalLabel
                            .style("opacity", 1)
                            .attr("x", mousex)
                            .text(d3.timeFormat("%b %_d")(parse_date(d.date)));

                        verticalLabelBg
                            .attr("x", mousex - 30)
                            .attr("y", dateY - 14)
                            .attr("width", 60)
                            .attr("height", 18)
                            .style("opacity", 1);

                        var addedVal = +d.added_today || 0;
                        var droppedVal = +d.dropped_today || 0;

                        addedLabel
                            .style("text-anchor", "end")
                            .attr("x", mousex - 6)
                            .attr("y", metricsY)
                            .text("+ " + addedVal)
                            .style("opacity", addedVal > 0 ? 1 : 0);

                        addedLabelBg
                            .attr("x", mousex - 41)
                            .attr("y", metricsY - 14)
                            .attr("width", 40)
                            .attr("height", 16)
                            .style("opacity", addedVal > 0 ? 1 : 0);

                        droppedLabel
                            .style("text-anchor", "start")
                            .attr("x", mousex + 6)
                            .attr("y", metricsY)
                            .text("- " + droppedVal)
                            .style("opacity", droppedVal > 0 ? 1 : 0);

                        droppedLabelBg
                            .attr("x", mousex + 1)
                            .attr("y", metricsY - 14)
                            .attr("width", 40)
                            .attr("height", 16)
                            .style("opacity", droppedVal > 0 ? 1 : 0);
                    }
                } else {
                    hideCrosshairs();
                }
            })
            .on("mouseleave", hideCrosshairs);


        // Zoom redrawing
        function zoomed() {
            if (!library_x_orig) return;

            is_panning = true;

            var new_x = d3.event.transform.rescaleX(library_x_orig);
            current_x_scale = new_x;

            hideCrosshairs();

            // Update axis
            gX.call(library_x_axis.scale(new_x));

            // Update trendline
            library_line.x((d) => new_x(parse_date(d.date)));
            trendline.attr("d", library_line);

            // Update recent highlight rect
            recentRect
                .attr("x", new_x(highlight_period))
                .attr("width", new_x(max_date) - new_x(highlight_period));


            clearTimeout(window.zoomPanelTimeout);
            window.zoomPanelTimeout = setTimeout(function () {
                is_panning = false;
            }, 80);
        }

        hideLoader("library");

    });