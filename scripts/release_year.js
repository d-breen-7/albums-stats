var dy_margins = { top: 0, right: 0, bottom: 0, left: 75 };

var dy_width = d3.select("#stats-image-4").node().offsetWidth,
  dy_height = d3.select("#stats-image-4").node().offsetHeight;

d3.json(
  "https://i3aounsm6zgjctztzbplywogfy0gnuij.lambda-url.eu-west-1.on.aws/release-year"
).then(function (response) {

  let data = response.data;

  let years = tidy(
    data, 
    arrange("year_num"), 
    groupBy("year_num", slice(0, 1))
  );

  var num_years = data.length,
    num_decades = [...new Set(data.map((d) => d.decade_num))].length;

  // Add sub-title text
  d3.select("#stats-4-text")
    .append("h2")
    .html(
      "I've listened to albums from " +
        num_years +
        " years spread across " +
        num_decades +
        " decades"
    );

  let decades = tidy(
    data,
    arrange("decade_num"),
    groupBy("decade_num", slice(0, 1))
  );

  var dy_scale = d3.scaleLog().domain(d3.extent(data, (d) => +d.year_total));

  var dy_color = d3
    .scaleLinear()
    .domain([0, 0.85, 1])
    .range(["#eeeeee", "#76e99f", "#1db954"]);

  var dy_rect_width = dy_width / 12, 
  dy_rect_height = dy_height / (num_decades + 2);

  var dy_svg = d3
    .select("#stats-image-4")
    .append("svg")
    .attr("id", "dy-svg")
    .attr("viewBox", [0, 0, dy_width, dy_height]);

  no_albums = textures
  //.lines()
  //.paths()
  //.d("crosses")
  //.lighter()
  //.thicker() 
  //.circles()
  //.heavier()
    .lines()
    .orientation("vertical", "horizontal")
    .size(4)
    .strokeWidth(1)
    .shapeRendering("crispEdges") 
    .background("#ffffff")
    .stroke("#dcf9e6");

  dy_svg.call(no_albums);

  dy_svg
    .append("rect")
    .attr("class", "dy-back")
    .attr("x", dy_rect_width)
    .attr("y", dy_rect_height * 2)
    .attr("width", dy_rect_width * 10)
    .attr("height", dy_rect_height * num_decades)
    .attr("fill", no_albums.url());

  // Year grid
  dy_svg
    .selectAll("dy-svg")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "dy-grid")
    .attr("x", (d) => dy_rect_width + dy_rect_width * d.year_num)
    .attr("y", (d) => dy_rect_height * 2 + dy_rect_height * d.decade_num)
    .attr("width", dy_rect_width)
    .attr("height", dy_rect_height)
    .attr("fill", (d) => dy_color(dy_scale(d.year_total)))
    .text((d) => d.decade_num + " " + d.year_num);

  // Axis lines
  dy_svg
    .selectAll("dy-svg")
    .data(years)
    .enter()
    .append("line")
    .attr("class", "dy-line")
    .attr("x1", (d) => dy_rect_width + d.year_num * dy_rect_width)
    .attr("x2", (d) => dy_rect_width + d.year_num * dy_rect_width)
    .attr("y1", dy_rect_height * 2 - 10)
    .attr("y2", dy_rect_height * 2 + dy_rect_height * num_decades + 10);

  dy_svg
    .selectAll("dy-svg")
    .data(decades)
    .enter()
    .append("line")
    .attr("class", "dy-line")
    .attr("x1", dy_rect_width - 10)
    .attr("x2", dy_rect_width + dy_rect_width * 175 + 10)
    .attr("y1", (d) => dy_rect_height * 2 + d.decade_num * dy_rect_height)
    .attr("y2", (d) => dy_rect_height * 2 + d.decade_num * dy_rect_height);

  dy_svg
    .selectAll("dy-svg")
    .data(decades)
    .enter()
    .append("text")
    .attr("class", "dy-text")
    .attr("x", dy_rect_width - 5)
    .attr("y", (d) => dy_rect_height * 2.5 + d.decade_num * dy_rect_height)
    .text((d) => d.decade + "0's")
    .attr("alignment-baseline", "middle");

  // Legend
  var legend_data = [
    ...new d3.range(1, d3.extent(data, (d) => +d.year_total)[1]),
  ];

  var legend_labels = [10, 100, 200, 500, 1000];

  var legend_width = dy_rect_width * 5;

  dy_svg
    .append("rect")
    .attr("class", "dy-grid")
    .attr("x", dy_rect_width)
    .attr("y", dy_rect_height / 2)
    .attr("width", dy_rect_width / 2)
    .attr("height", dy_rect_height / 2)
    .attr("fill", no_albums.url());

  dy_svg
    .selectAll("dy-svg")
    .data(legend_data)
    .enter()
    .append("rect")
    .attr("class", "dy-grid")
    .attr(
      "x",
      (d, i) => dy_rect_width * 2 + (i * legend_width) / legend_data.length
    )
    .attr("y", dy_rect_height / 2)
    .attr("width", legend_width / legend_data.length)
    .attr("height", dy_rect_height / 2)
    .attr("fill", (d) => dy_color(dy_scale(d)));

  dy_svg
    .selectAll("dy-svg")
    .data(legend_data)
    .enter()
    .append("text")
    .attr("class", "dy-text-legend")
    .attr(
      "x",
      (d, i) => dy_rect_width * 2 + (i * legend_width) / legend_data.length
    )
    .attr("y", dy_rect_height)
    .text((d) => (legend_labels.includes(d) ? d : ""))
    .attr("alignment-baseline", "hanging");

  dy_svg
    .append("text")
    .attr("class", "dy-text-legend")
    .attr("x", dy_rect_width)
    .attr("y", dy_rect_height)
    .text("None")
    .attr("alignment-baseline", "hanging");

  dy_svg
    .append("text")
    .attr("class", "dy-text-legend")
    .attr("x", dy_rect_width)
    .attr("y", dy_rect_height * 1.75)
    .text("Years in decade")
    .attr("alignment-baseline", "baseline");

  const arrow = d3.arrow1().id("my-arrow").attr("class", "dy-arrow");

  dy_svg.call(arrow);

  dy_svg
    .append("polyline")
    .attr("id", "dy-arrow") 
    .attr("class", "dy-arrow")
    .attr("marker-end", "url(#my-arrow)")
    .attr("points", [
      [dy_rect_width + 5, dy_rect_height * 1.9],
      [dy_rect_width + 80, dy_rect_height * 1.9],
    ]);

  const loader = document.querySelector(".loader");
  loader.className += " hidden";
});
