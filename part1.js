const svg = d3.select("#part1");
let xscale = d3.scaleLinear()
            .domain([0, 6])
            .range([0, 400]);

let yscale = d3.scaleLinear()
            .domain([0, 6])
            .range([400, 0]);

const ON_COLOR = "darkorange";
const OFF_COLOR = "black";

const unusedPointData = [
    {x: 3, y: 1, color: "navy"},
    {x: 8, y: -3, color: "navy"},
    {x: 2, y: 3, color: "navy"},
    {x: 10, y: 1, color: "navy"},
    {x: 8, y: 3, color: "navy"},
    {x: 2, y: -2, color: "navy"},
    {x: 5, y: 0, color: "darkorange"},
    {x: 6, y: 5, color: "darkorange"},
    {x: 6, y: -4, color: "darkorange"},
    {x: 7, y: 0, color: "darkorange"},
    {x: 4, y: 2, color: "darkorange"},
];

function main() {
    const pointData = [
        {x: 2, y: 3.5},     // left
        {x: 4, y: 5},       // top
        {x: 6, y: 3.5},     // right
        {x: 4, y: 2},       // bottom
        {x: 4, y: 0},       // lowest
    ];
    const edgeData = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [3, 4],
    ];
    drawLines(pointData, edgeData);
    drawPoints(pointData);

    let data = [
        { "a" : 0, "b" : 1, "c" : 2, "d" : 1, "e" : 1 },
        { "a" : 0, "b" : 0, "c" : 1, "d" : 3, "e" : 4 },
        { "a" : 0, "b" : 0, "c" : 0, "d" : 3, "e" : 4 },
        { "a" : 0, "b" : 0, "c" : 0, "d" : 0, "e" : 1 },
        { "a" : 0, "b" : 0, "c" : 0, "d" : 0, "e" : 0 },
      ];

      stairTabulate(data, ["a", "b", "c", "d", "e"])

}

function stairTabulate(data, columns) {
	const table = d3.select('#table-container').append('table');
	const thead = table.append('thead');
	const tbody = table.append('tbody');

	thead.append('tr')
        .selectAll('th')
        .data([""].concat(columns))
        .enter()
        .append('th')
        .text(d => d);

    const rows = tbody
        .selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    rows.append('th')
        .text((_, i) => columns[i])

	rows.selectAll('td')
        .data(row => columns.map(col => ({
            column: col,
            value: row[col],
        })))
        .enter()
        .append('td')
        // .attr("class", d => d.value > 0 ? "border" : "")
        .text(d => d.value > 0 ? d.value: "");
}

function colorPoints() {
    return OFF_COLOR;
}

function drawLines(pointData, edgeData) {
    svg.selectAll(".lines").data(edgeData).join(
        enter => enter.append("line")
            .attr("stroke", "black")
            .attr("strokewidth", 5)
            .attr("x1", d => xscale(pointData[d[0]].x))
            .attr("y1", d => yscale(pointData[d[0]].y))
            .attr("x2", d => xscale(pointData[d[1]].x))
            .attr("y2", d => yscale(pointData[d[1]].y)),
        // upa => upa.style("fill", colorPoints)
    );
}


function drawPoints(pointData) {
    const DOTSIZE = 10;

    svg.selectAll(".points").data(pointData, d => d.id).join(
        enter => {
            enter.append("circle")
            .attr("class", "points")
            // .attr("opacity", 0.75)
            .style("fill", colorPoints)
            .attr("cx", d => xscale(d.x))
            .attr("cy", d => yscale(d.y))
            .attr("r", DOTSIZE)
            .on("mouseover", function(_) {
                // Needs to be a function to have access to "this".
                d3.select(this).style("fill", ON_COLOR);
            })
            .on("mouseout", function(_) {
                // Needs to be a function to have access to "this".
                d3.select(this).style("fill", OFF_COLOR);
            });
            enter.append("text")
                .attr("class", d => "label" + d.id)
                .style("text-anchor", "middle")
                .attr("x", d => xscale(d.x) + 20)
                .attr("y", d => yscale(d.y) + 10)
                .text((_, i) => i);
        },
        upa => upa.style("fill", colorPoints)
    );
}

function squaredDistanceBetween(a, b) {
    return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2);
}


function drawCircles() {
    svg.selectAll("circle").data(circles, d => d.id).join(
        enter => {
            enter.append("circle")
                .attr("id", d => d.id)
                .attr("class", "bigCircles")
                .attr("fill", "gray")
                .attr("opacity", 0.3)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", d => d.r)
                .call(d3.drag().on("drag", dragCallback));
            enter.append("text")
                .attr("class", d => "label" + d.id)
                .style("text-anchor", "middle")
                .attr("x", d => d.x)
                .attr("y", d => d.y)
                .text(d => (d.id === "circle0") ? "A" : "B")
                .call(d3.drag().on("drag", dragCallback));
        },
        upa => upa.attr("r", d => d.r)
    );
}


main();
