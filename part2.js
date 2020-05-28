const svg = d3.select("#part2");
const xscale = d3.scaleLinear().domain([0, 6]).range([0, 400]);
const yscale = d3.scaleLinear().domain([0, 6]).range([400, 0]);

const ON_COLOR = "grey";
const OFF_COLOR = "black";
const COLORS = ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#CFECF9', '#7F7F7F', '#BCBD22', '#17BECF']; // Tableau-10

function getRandInt(min, max) {
    // Includes min and max.
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandFloat(min, max) {
    // Includes min and max.
    return Math.random() * (max - min + 1) + min;
}

function weightedCoinFlip(prob) {
    return Math.random() < prob;
}

const k = 4;
const NUM_POINTS = 20;
let selected = [];


function createRandomPoints() {
    const ORIGIN = {x: 5, y: 0};
    let closestToOrigin = 0;
    let pointData = [];
    for (let i = 0; i < NUM_POINTS; i++) {
        const newPoint = {
            x: getRandFloat(1, 9),
            y: getRandFloat(-5, 4),
            color: COLORS[0],
            id: i,
        }
        if (i > 0 && squaredDist(newPoint, ORIGIN) < squaredDist(pointData[closestToOrigin], ORIGIN)) {
            closestToOrigin = i;
        }
        pointData.push(newPoint);
    }
    selected = [closestToOrigin];
    return pointData;
}

function createKSubsets(pointData) {
    let A = [pointData];
    for (let i = 1; i < k; i++) {
        let prob = Math.pow(NUM_POINTS, (-1 / k));
        let newArr = [];
        for (let j = 0; j < A[i-1].length; j++) {
            if (weightedCoinFlip(prob)) {
                A[i-1][j].color = COLORS[i];
                newArr.push(A[i-1][j]);
            }
        }
        A.push(newArr);
    }
    A.push([]);
    return A;
}


// let tableData = [];
//     for (let i = 0; i < k; i++) {
//         let row = {};
//         for (let j = 0; j < NUM_POINTS; j++) {
//             row[j] = 0;
//         }
//         tableData.push(row);
//         for (let j = 0; j < A[i].length; j++) {
//             tableData[i][A[i][j].id] = 1;
//         }
//     }


function main() {
    const pointData = createRandomPoints();
    const A = createKSubsets(pointData);
    let tableData = [];
    for (let i = 0; i < NUM_POINTS; i++) {
        let row = {};
        for (let j = 0; j < k; j++) {
            row[j] = 0;
        }
        tableData.push(row);

    }

    drawLines(pointData);
    drawPoints(pointData);
    tabulate(tableData, [...Array(tableData.length).keys()]);
}


function tabulate(data, columns) {
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
        .text(d => d.value);
}


function drawLines(pointData) {
    const allPointPairs = d3.cross(pointData, pointData).filter(z => z[0].id == selected[0]);
    svg.selectAll(".lines").data(allPointPairs).join(
        enter => enter.append("line")
            .attr("stroke", "black")
            .attr("strokewidth", 5)
            .attr("x1", d => xscale(d[0].x))
            .attr("y1", d => yscale(d[0].y))
            .attr("x2", d => xscale(d[1].x))
            .attr("y2", d => yscale(d[1].y)),
    );
}


function drawPoints(pointData) {
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
                drawCircles(pointData);
                drawPoints(pointData);
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
        update => update.raise()
    );
}

function squaredDist(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}


function drawCircles(pointData) {
    const centerPoint = pointData[selected[0]];
    const radiusPoint = pointData[selected[1]];
    console.log(squaredDist(centerPoint, radiusPoint))
    svg.selectAll(".bigCircle").data([pointData[0]]).join(
        enter => {
            enter.append("circle")
            .attr("id", "bigCircle" + pointData[selected[0]].id)
            .attr("class", "bigCircle")
            .attr("fill", "red")
            .attr("opacity", 0.3)
            .attr("cx", xscale(centerPoint.x))
            .attr("cy", yscale(centerPoint.y))
            .attr("r", xscale(Math.sqrt(squaredDist(centerPoint, radiusPoint))))
        },
        update => update.attr("r",
            xscale(Math.sqrt(squaredDist(centerPoint, radiusPoint)))
        )
    );
}


main();