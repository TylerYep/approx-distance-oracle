const svg = d3.select("#part2");
const xscale = d3.scaleLinear().domain([0, 6]).range([0, 400]);
const yscale = d3.scaleLinear().domain([0, 6]).range([400, 0]);

const ON_COLOR = "grey";
const OFF_COLOR = "black";
const COLORS = [
    '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD',
    '#8C564B', '#CFECF9', '#7F7F7F', '#BCBD22', '#17BECF'
]; // Tableau-10


function squaredDist(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
}

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

let selected = [];
const kBar = document.getElementById("kBar");
const pointBar = document.getElementById("pointBar");

let k;
let numPoints;

// ADO CODE

function createRandomPoints() {
    let pointData = [];
    for (let i = 0; i < numPoints; i++) {
        const newPoint = {
            x: getRandFloat(1, 9),
            y: getRandFloat(-5, 4),
            color: COLORS[0],
            id: i,
        }
        pointData.push(newPoint);
    }
    return pointData;
}


function createKSubsets(pointData) {
    let A = [pointData];
    for (let i = 1; i < k; i++) {
        let prob = Math.pow(numPoints, (-1 / k));
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


function findClosestVertex(A_i, v) {
    let minDist = Infinity;
    let closestVertex = null;
    for (let w of A_i) {
        let computedDist = squaredDist(v, w);
        if (computedDist < minDist) {
            minDist = computedDist;
            closestVertex = w;
        }
    }
    return closestVertex;
}

// END OF ADO CODE

kBar.addEventListener("input", main);
pointBar.addEventListener("input", main);

function main() {
    // remove all elements on the page
    svg.selectAll("*").remove();
    const bunchTable = document.getElementById("bunchTable")
    if (bunchTable) bunchTable.remove();

    // get values of k and numPoints from the slider bars
    k = parseInt(kBar.value);
    numPoints = parseInt(pointBar.value);
    document.getElementById("kValue").innerHTML = `(k = ${k})`
    document.getElementById("pointValue").innerHTML = `(# of Nodes = ${numPoints})`;

    // Compute i-centers and witnesses using the algorithm.
    const pointData = createRandomPoints();
    const A = createKSubsets(pointData);
    const tableData = generateTableData(A, pointData);
    const A_ids = A.map(vset => vset.map(v => v.id));

    // Draw results
    drawPoints(pointData, A_ids, 0);
    tabulate(tableData, [...Array(tableData.length).keys()], [...Array(k).keys()], pointData, A_ids);
}


function generateTableData(A, pointData) {
    let tableData = [];
    for (let v = 0; v < numPoints; v++) {
        let row = {};
        for (let i = 0; i < k; i++) {
            const vert = findClosestVertex(A[i], pointData[v]);
            if (vert == null) {
                // If it doesn't work, refresh and try again
                const newPointData = createRandomPoints();
                const newA = createKSubsets(newPointData);
                return generateTableData(newA, newPointData);
            }
            row[i] = vert.id;
        }
        tableData.push(row);
    }
    return tableData;
}


function tabulate(data, rowHeaders, columnHeaders, pointData, A) {
	const table = d3.select('#table-container').append('table').attr("id", "bunchTable");
	const thead = table.append('thead');
	const tbody = table.append('tbody');

	thead.append('tr')
        .selectAll('th')
        .data([""].concat(columnHeaders))
        .enter()
        .append('th')
        // .text("Table Column Headers")
        .style("background-color", (_, i) => i > 0 ? COLORS[i-1] : "none");

    const rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    rows.append('th')
        .text((_, i) => rowHeaders[i])

	rows.selectAll('td')
        .data((row, r) => columnHeaders.map(col => ({
            row: r,
            column: col,
            value: row[col],
        })))
        .enter()
        .append('td')
        .text(d => d.value)
        .on("mouseover", d => {
            selected = [d.row];
            drawLines(pointData, d);
            drawCircles([pointData[d.row]], [pointData[d.value]], d.column);
            drawPoints(pointData, A, d.column);
        })
        .on("mouseout", _ => {
            // Remove all drawn artifacts
            selected = [];
            drawLines([]);
            drawCircles([]);
            drawPoints(pointData, null, null);
        });
}


function drawLines(pointData, d) {
    const allPointPairs = d3.cross(pointData, pointData).filter(z =>
        z[0].id == selected[0]
        && z[0].id !== z[1].id
        && squaredDist(z[0], z[1]) <= squaredDist(pointData[d.value], z[0])
    );
    svg.selectAll(".lines").data(allPointPairs, d => d.id).join(
        enter => enter.append("line")
            .attr("class", "lines")
            .attr("stroke", "black")
            .attr("strokewidth", 5)
            .attr("x1", d => xscale(d[0].x))
            .attr("y1", d => yscale(d[0].y))
            .attr("x2", d => xscale(d[1].x))
            .attr("y2", d => yscale(d[1].y))
    );
    svg.selectAll(".lineText").data(allPointPairs, d => d.id).join(
        enter => enter.append("text")
            .attr("class", "lineText")
            .style("text-anchor", "middle")
            .style("user-select", "none")
            .text(d => Math.sqrt(squaredDist(d[0], d[1])).toFixed(2))
            .attr("transform", d => {
                const xCoord = xscale((d[0].x + d[1].x) / 2) + 10;
                const yCoord = yscale((d[0].y + d[1].y) / 2) + 15;
                const rotation = Math.atan2(d[0].y - d[1].y, d[0].x - d[1].x);
                return `translate(${xCoord},${yCoord}) rotate(${rotation})`;
            })
    );
}


function drawPoints(pointData, A, k) {
    const DOTSIZE = 12;

    // .join() is the best way I've found to use d3. The first line uses selectAll(), which
    // finds all of the elements on the page with class "points". If there are none, it creates them.

    // .data() allows you to input the graph data. Easiest way is a using a List of Dicts.
    // d => d.id maps each newly created element to an id so that it updates rather than rerenders.
    // All of these functions come with a callback function that is the row of data it is processing,
    // e.g. {x: 5, y: 10, id: 10}
    svg.selectAll(".points").data(pointData, d => d.id).join(
        enter => {
            // enter is like a context - this is the element(s) that is about to be added to the page.
            // you can add attributes very simliar to HTML ones.
            enter.append("circle")
            .attr("id", d => "circle" + d.id)
            .attr("class", "points")  // Make sure this matches selector in the selectAll().
            .style("fill", d => d.color)
            .attr("cx", d => xscale(d.x))
            .attr("cy", d => yscale(d.y))
            .attr("r", DOTSIZE)
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
                .attr("x", d => xscale(d.x) + 20)
                .attr("y", d => yscale(d.y) + 5)
                .style("text-anchor", "middle")
                .style("user-select", "none")
                .text((_, i) => i);
        },
        // update allows you to call drawPoints() again, and instead of creating brand new points,
        // skip the enter => code and do just this instead.
        // raise() moves the points to the top layer of the SVG, kind of like z-index
        update => update.raise()
            .style("fill", d => {
                if (selected.length == 0) {
                    return d.color;
                } else if (selected[0] === d.id && A[k].includes(d.id)) {
                    return COLORS[k];
                } else if (selected[0] !== d.id) {
                    return A[k].includes(d.id) ? COLORS[k] : "grey";
                }
                return d.color;
            })
        // You can also add a custom remove => function
        // remove => remove.do stuff
    );
}


function drawCircles(centerPointData, radiusPoint = [], color = null) {
    svg.selectAll(".bigCircle").data(d3.zip(centerPointData, radiusPoint), d => d[0].id).join(
        enter => {
            enter.append("circle")
            .attr("class", "bigCircle")
            .attr("fill", "rgb(255,204,203)")
            .style("stroke", COLORS[color])
            .style("stroke-width", 3)
            .style("stroke-dasharray", "3, 3")
            .attr("cx", d => xscale(d[0].x))
            .attr("cy", d => yscale(d[0].y))
            .attr("r", d =>
                (d[0].id != d[1].id) ? xscale(Math.sqrt(squaredDist(d[0], d[1]))) : 20
            ).lower();
        },
        update => update.attr("r", d =>
            (d[0].id != d[1].id) ? xscale(Math.sqrt(squaredDist(d[0], d[1]))) : 20
        )
    );
}


main();
