const svg = d3.select("#vis").attr("width", 1000).attr("height", 800);
let xscale = d3.scaleLinear()
            .domain([0, 6])
            .range([0, 400]);

let yscale = d3.scaleLinear()
            .domain([0, 6])
            .range([400, 0]);

const ON_COLOR = "darkorange";
const OFF_COLOR = "gray";


function main() {
    const pointData = [
        {x: 1, y: 2},
        {x: 2, y: 1},
        {x: 3, y: 0},
        {x: 4, y: 5},
        {x: 5, y: 3},
    ];
    drawPoints(pointData);
}


function colorPoints() {
    return "gray";
}


function drawPoints(pointData) {
    const DOTSIZE = 10;

    svg.selectAll(".points").data(pointData, d => d.id).join(
        enter => enter.append("circle")
            .attr("class", "points")
            .attr("opacity", 0.75)
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
            })
            .on("click", d => {
                svg.append("line")
                    .attr("stroke", "black")
                    .attr("strokewidth", 5)
                    .attr("x1", xscale(d.x))
                    .attr("y1", yscale(d.y))
                    .attr("x2", xscale(0))
                    .attr("y2", yscale(0));
            }),
        update => update.style("fill", colorPoints)
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
        update => update.attr("r", d => d.r)
    );
}


main();
