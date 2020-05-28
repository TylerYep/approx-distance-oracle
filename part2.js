const svg = d3.select("#part2");
let xscale = d3.scaleLinear()
            .domain([0, 6])
            .range([0, 400]);

let yscale = d3.scaleLinear()
            .domain([0, 6])
            .range([400, 0]);

const ON_COLOR = "grey";
const OFF_COLOR = "black";
let selected = [6];

const pointData = [
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
for (let i = 0; i < pointData.length; i++) {
    pointData[i].id = i;
}


function main() {
    const bunches = [[0, 1, 3, 5], [2, 4]]
    drawLines();
    drawPoints();
}

function colorPoints() {
    return OFF_COLOR;
}

function drawLines(centerPoint = 6) {
    const allPointPairs = d3.cross(pointData, pointData).filter(z => z[0].id == centerPoint);
    svg.selectAll(".lines").data(allPointPairs).join(
        enter => enter.append("line")
            .attr("stroke", "black")
            .attr("strokewidth", 5)
            .attr("x1", d => xscale(d[0].x))
            .attr("y1", d => yscale(d[0].y))
            .attr("x2", d => xscale(d[1].x))
            .attr("y2", d => yscale(d[1].y)),
        // update => update.style("fill", colorPoints)
    );
}


function drawPoints() {
    const DOTSIZE = 10;

    svg.selectAll(".points").data(pointData, d => d.id).join(
        enter => {
            enter.append("circle")
            .attr("id", d => "circle" + d.id)
            .attr("class", "points")
            .style("fill", d => d.color)
            .attr("cx", d => xscale(d.x))
            .attr("cy", d => yscale(d.y))
            .attr("r", DOTSIZE)
            .on("click", d => {
                if (selected.length == 2) {
                    selected[1] = d.id;
                } else {
                    selected.push(d.id);
                }
                drawCircles();
                drawPoints();
                console.log(selected);
            })
            .on("mouseover", function(_) {
                // Needs to be a function to have access to "this".
                d3.select(this).style("fill", ON_COLOR);
            })
            .on("mouseout", function(_) {
                // Needs to be a function to have access to "this".
                d3.select(this).style("fill", d => d.color);
            });
            enter.append("text")
                .attr("class", d => "label" + d.id)
                .style("text-anchor", "middle")
                .attr("x", d => xscale(d.x) + 20)
                .attr("y", d => yscale(d.y) + 10)
                .text((_, i) => i);
        },
        update => update.style("fill", colorPoints).raise()
    );
}

function squaredDistanceBetween(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}


function drawCircles() {
    const centerPoint = pointData[selected[0]];
    const radiusPoint = pointData[selected[1]];
    console.log(squaredDistanceBetween(centerPoint, radiusPoint))
    svg.selectAll(".bigCircle").data([pointData[0]]).join(
        enter => {
            enter.append("circle")
            .attr("id", "bigCircle" + pointData[selected[0]].id)
            .attr("class", "bigCircle")
            .attr("fill", "red")
            .attr("opacity", 0.3)
            .attr("cx", xscale(centerPoint.x))
            .attr("cy", yscale(centerPoint.y))
            .attr("r", xscale(Math.sqrt(squaredDistanceBetween(centerPoint, radiusPoint))))
        },
        update => update.attr("r",
            xscale(Math.sqrt(squaredDistanceBetween(centerPoint, radiusPoint)))
        ))


}


main();
