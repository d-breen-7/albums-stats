var library_margins = { top: 20, right: 10, bottom: 30, left: 60 },
    parse_date = d3.timeParse("%Y-%m-%d");

const samplePandasData = [
    {
        total_albums: 333,
        total_new_artist: 254,
        total_recent_added: 52,
        total_new_release: 4,
        duration_total: 922184155,
        duration_average: 2769321,
        duration_max: 7536020,
        duration_min: 1270030,
    },
];

// Helper function to format value to days, hours and mins
function format_milliseconds(msValue) {
    if (msValue === undefined || msValue === null || isNaN(msValue)) return "-";

    // Convert milliseconds directly to total minutes
    const totalMinutes = Math.round(msValue / 60000);

    if (totalMinutes === 0) return "0 min";

    const minutesInDay = 24 * 60;
    const minutesInHour = 60;

    // Split into days, hours and mins
    const days = Math.floor(totalMinutes / minutesInDay);
    const hours = Math.floor((totalMinutes % minutesInDay) / minutesInHour);
    const mins = totalMinutes % minutesInHour;

    let parts = [];

    // Format value based on days, hours and mins
    if (days > 0) {
        parts.push(`${days} day${days > 1 ? "s" : ""}`);
    }
    if (hours > 0) {
        parts.push(`${hours} hr${hours !== 1 ? "s" : ""}`);
    }
    if ((mins > 0) & (days < 1)) {
        parts.push(`${mins} min${mins !== 1 ? "s" : ""}`);
    }

    return parts.join(" ");
}

// Layout format hooks
const formats = {
    duration_total: format_milliseconds,
    duration_average: format_milliseconds,
    duration_max: format_milliseconds,
    duration_min: format_milliseconds,
    total_albums: d3.format(","),
    total_new_artist: d3.format(","),
    total_recent_added: d3.format(","),
    total_new_release: d3.format(","),
};

function renderMetrics(dataArray) {
    const stats = dataArray[0];

    d3.selectAll("[data-metric]").each(function () {
        const element = d3.select(this);
        const metricKey = element.attr("data-metric");
        const rawValue = stats[metricKey];

        if (rawValue !== undefined) {
            const formatter = formats[metricKey] || ((d) => d);
            element.text(formatter(rawValue));
        }
    });
}

// Run layout update step
renderMetrics(samplePandasData);

d3.json(
    // "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/albums",
    ".//data//library_duration_data.json"
).then(function (response) {

    let library_img_width = d3.select("#library-image").node().offsetWidth,
        library_img_height = d3.select("#library-image").node().offsetHeight;

    const max_date = d3.extent(response, d => parse_date(d.date))[1]
    const recent_start_date = d3.timeMonth.offset(max_date, -1)
    const y_max_limit = Math.ceil(d3.max(response, (d) => +d.total_duration));
    const day_ticks = d3.range(0, y_max_limit + 1);
    const y_scale = d3.scaleLinear()
        .domain([0, y_max_limit])
        .range([library_img_height, 0]);

    // Calculate the precise inner width of the chart grid canvas
    const chartInnerWidth = library_img_width - library_margins.left - library_margins.right - 45;

    // Define SVG
    var library_svg = d3
        .select("#library-image")
        .append("svg")
        .attr("id", "library-svg")
        .attr("width", library_img_width)
        .attr("height", library_img_height);

    // Define X axis
    var library_x = d3
        .scaleTime()
        .domain(d3.extent(response, (d) => parse_date(d.date)))
        .range([
            library_margins.left,
            library_margins.left + chartInnerWidth // Aligned directly to chart inner width boundary
        ]);

    var library_x_axis = d3
        .axisBottom(library_x)
        .tickSize(-(library_img_height - library_margins.top - library_margins.bottom)) // Bounds grid line height inside the axes area
        .tickPadding(10)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat("%b %y"));

    library_svg
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
        .domain([0, d3.max(response, (d) => +d.total_duration)])
        .range([
            library_img_height - library_margins.bottom,
            library_margins.top
        ]);

    var library_y_axis = d3
        .axisLeft()
        .scale(library_y)
        .ticks(y_max_limit / 100)
        .tickPadding(55)
        .tickSize(-chartInnerWidth);

    library_svg
        .append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(" + (library_margins.left) + ", 0)")
        .call(library_y_axis);

    // Recent period
    library_svg
        .append("rect")
        .attr("y", 0)
        .attr("height", library_img_height - library_margins.bottom)
        .style("fill", "#1db954")
        .attr("x", library_x(recent_start_date))
        .attr("width", library_x(max_date) - library_x(recent_start_date))
        .style("opacity", 0.1);

    var library_line = d3
        .line()
        // .defined(d => d.total_duration !== null)
        .x((d) => library_x(parse_date(d.date)))
        .y((d) => library_y(d.total_duration))
        .curve(d3.curveMonotoneX);

    library_svg
        .append("path")
        .data([response])
        .attr("class", "library-trendline")
        .attr("d", library_line);

    // ==========================================
    // CROSSHAIRS INTERACTION ENGINE
    // ==========================================
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

    // BACKGROUND RECTANGLES DECLARED FIRST
    var addedLabelBg = crosshairG.append("rect")
        .attr("fill", "white")
        .style("pointer-events", "none")
        .style("opacity", 0);

    var droppedLabelBg = crosshairG.append("rect")
        .attr("fill", "white")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // TEXT LABELS DECLARED LAST
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

    library_svg
        .on("mousemove", function () {
            var mouse = d3.mouse(this);
            var mousex = mouse[0];
            var mousey = mouse[1];

            var minX = library_margins.left;
            var maxX = library_margins.left + chartInnerWidth;
            var minY = library_margins.top;
            var maxY = library_img_height - library_margins.bottom;

            if (mousex >= minX && mousex <= maxX && mousey >= minY && mousey <= maxY) {
                var hoveredDate = library_x.invert(mousex);
                var i = bisectDate(response, hoveredDate, 1);

                if (i >= response.length) {
                    i = response.length - 1;
                }

                var d0 = response[i - 1];
                var d1 = response[i];
                var d = d1;

                if (d0 && d1) {
                    d = hoveredDate - parse_date(d0.date) > parse_date(d1.date) - hoveredDate ? d1 : d0;
                }

                if (d) {
                    var snappedValue = +d.total_duration;
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
                        .attr("width", 75)
                        .attr("height", 20)
                        .style("opacity", 1);

                    var dateTextX = mousex;
                    var dateBgX = mousex - 30;

                    verticalLabel
                        .style("opacity", 1)
                        .attr("x", dateTextX)
                        .text(d3.timeFormat("%b %_d")(hoveredDate));

                    verticalLabelBg
                        .attr("x", dateBgX)
                        .attr("y", dateY - 14)
                        .attr("width", 60)
                        .attr("height", 18)
                        .style("opacity", 1);

                    var addedVal = +d.added_today || 0;
                    var droppedVal = +d.dropped_today || 0;

                    var addedTextX = (mousex - 6);
                    var addedBgX = (mousex - 41);
                    var droppedTextX = (mousex + 6);
                    var droppedBgX = (mousex + 6);

                    addedLabel
                        .style("text-anchor", "end")
                        .attr("x", addedTextX)
                        .attr("y", metricsY)
                        .text("+ " + addedVal)
                        .style("opacity", addedVal > 0 ? 1 : 0);

                    addedLabelBg
                        .attr("x", addedBgX)
                        .attr("y", metricsY - 14)
                        .attr("width", 40)
                        .attr("height", 16)
                        .style("opacity", addedVal > 0 ? 1 : 0);

                    droppedLabel
                        .style("text-anchor", "start")
                        .attr("x", droppedTextX)
                        .attr("y", metricsY)
                        .text("- " + droppedVal)
                        .style("opacity", droppedVal > 0 ? 1 : 0);

                    droppedLabelBg
                        .attr("x", droppedBgX - 5)
                        .attr("y", metricsY - 14)
                        .attr("width", 40)
                        .attr("height", 16)
                        .style("opacity", droppedVal > 0 ? 1 : 0);
                }
            } else {
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
        })
        .on("mouseover", function () { })
        .on("mouseleave", function () {
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
        });

});

