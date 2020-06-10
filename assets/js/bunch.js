const svg = d3.select("#part3");
const xscale = d3.scaleLinear().domain([0, 6]).range([0, 400]);
const yscale = d3.scaleLinear().domain([0, 6]).range([400, 0]);

const ON_COLOR = "grey";
const OFF_COLOR = "black";
const COLORS = [
    '#DDDDDD', '#555555', '#2CA02C', '#D62728', '#9467BD',
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

let k;
let numPoints;

// const kBar = document.getElementById("kBar");
const pointBar = document.getElementById("pointBar");

let selected = [];
let frozenCircle = false;
let pointData = []

// ADO CODE

function createRandomPoints() {
    const ORIGIN = { x: 5, y: 0 };
    let closestToOrigin = 0;
    for (let i = 0; i < numPoints; i++) {
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
        let prob = Math.pow(numPoints, (-1 / k));
        let newArr = [];
        for (let j = 0; j < A[i - 1].length; j++) {
            if (weightedCoinFlip(prob)) {
                A[i - 1][j].color = COLORS[i];
                newArr.push(A[i - 1][j]);
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


function generateBunches() {
    // # Initialize table of calculated distances
    data.distances = {};
    for (v in data.A[0]) {
        data.distances[v] = {};
        for (w in data.A[0]) {
            const d = (v === w) ? 0 : Math.sqrt(squaredDist(data.A[0][v], data.A[0][w]));
            data.distances[v][w] = d;
        }
    }
    // Create bunches
    data.B = {};
    for (v in data.A[0]) {
        data.B[v] = new Set();
        for (i = 1; i <= k; i++) {
            for (let [_, { id: w }] of Object.entries(data.A[i - 1])) {
                const witness = data.p[v][i];
                if (data.distances[v][w] <= data.distances[v][witness]) {
                    data.B[v].add(w);
                }
            }
        }
        for (let [_, { id: w }] of Object.entries(data.A[k - 1])) {
            data.B[v].add(w);
        }
    }
}


function query(u, v) {
    w = u;
    i = 0;
    while (!data.B[v.id].has(w.id)) {
        i += 1;
        [u, v] = [v, u];
        w = data.A[0][data.p[u.id][i]];
    }
    console.log(u, v, w);
    return [w, data.distances[u.id][w.id] + data.distances[w.id][v.id]];
}


// END OF ADO CODE

let data = {};

// kBar.addEventListener("input", main);
pointBar.addEventListener("input", main);

function displayInfo() {
    const info = document.getElementById("table_container");
}

function main() {
    svg.selectAll("*").remove();
    data = {};
    pointData = [];
    console.log("hi");

    k = 2;
    numPoints = parseInt(pointBar.value);
    document.getElementById("pointValue").innerHTML = `(# of Nodes = ${numPoints})`;

    pointData = createRandomPoints();
    data.A = createKSubsets(pointData);
    data.p = generateTableData(pointData);
    console.log(data.p, k, numPoints);
    generateBunches();
    console.log(data);
    drawPoints(pointData);
    data.u = null;
    data.v = null;
    data.w = null;
}


function generateTableData(pointData) {
    let tableData = [];
    for (let v = 0; v < numPoints; v++) {
        let row = {};
        for (let i = 0; i < k; i++) {
            const vert = findClosestVertex(data.A[i], pointData[v]);
            if (vert == null) {
                // If it doesn't work, refresh and try again
                main();
            }
            row[i] = vert.id;
        }
        tableData.push(row);
    }
    return tableData;
}

function drawPoints(pointData) {
    const DOTSIZE = 12;

    // .join() is the best way I've found to use d3. The first line uses selectAll(), which
    // finds all of the elements on the page with class "points". If there are none, it creates them.

    // .data() allows you to input the graph data. Easiest way is a using a List of Dicts.
    // d => d.id maps each newly created element to an id so that it updates rather than rerenders.
    // All of these functions come with a callback function that is the row of data it is processing, e.g. {x: 5, y: 10, id: 10}
    svg.selectAll(".points").data(pointData, d => d.id).join(
        enter => {
            // enter is like a context - this is the element(s) that is about to be added to the page.
            // you can add attributes very simliar to HTML ones.
            enter.append("circle")
                .attr("id", d => "point_" + d.id)
                .attr("class", "points")  // Make sure this matches selector in the selectAll().
                .style("fill", d => d.color)
                .attr("cx", d => xscale(d.x))
                .attr("cy", d => yscale(d.y))
                .attr("r", DOTSIZE)
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut)
        },
        // update allows you to call drawPoints() again, and instead of creating brand new points,
        // skip the enter => code and do just this instead.
        // raise() moves the points to the top layer of the SVG, kind of like z-index
        update => update.raise()
        // You can also add a custom remove => function
        // remove => remove.do stuff
    );
    // Add arrowheads
    svg.append("svg:defs")
        .selectAll("marker")
        .data(["end"]) // Different link/path types can be defined here
        .enter().append("svg:marker") // This section adds in the arrows
        .attr("id", String) // this makes the id as 'end', coming from data
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

}

function clearLines() {
    d3.selectAll(".distance").remove();
}

function unselectPoint(point) {
    if (point !== data.u) {
        clearBunch(point);
    }
}

function clearBunch({ id }) {
    d3.selectAll(`.bunch_${id}`).remove();
    d3.selectAll(`#circle_${id}`).remove();
}

function drawLine(start, end, { label = "", class_id = "", color = "black", stroke_width = 1, marker_end = "none" }) {
    console.log(`Drawing line between ${start.id} and ${end.id}`);
    let line = svg.append("g")
        .attr("class", class_id)
        .classed("line_group", true);
    line.append('line')
        .style("stroke", color)
        .style("stroke-width", stroke_width)
        .attr("x1", xscale(start.x))
        .attr("y1", yscale(start.y))
        .attr("x2", xscale(end.x))
        .attr("y2", yscale(end.y))
        .attr("marker-end", marker_end);
    let mid_x = start.x + ((end.x - start.x) / 2);
    let mid_y = start.y + ((end.y - start.y) / 2);
    line.append("text")
        .attr('text-anchor', 'middle')
        .text(label)
        .attr("id", `line_label_${start.id}_${end.id}`)
        .style("user-select", "none")
        .attr("x", xscale(mid_x) - 10)
        .attr("y", yscale(mid_y) + 20)
}

function drawCircle(center) {
    const witnesses = data.p[center.id];
    let circle = svg.append("g")
        .attr("class", "circle_group")
        .attr("id", `circle_${center.id}`)
        .lower();
    for (let [_, witness_id] of Object.entries(witnesses).reverse()) {
        let witness = data.A[0][witness_id];
        const r = (center.id != witness_id) ?
            xscale(Math.sqrt(squaredDist(center, witness))) : 20;
        circle.append("circle")
            .attr("class", "bigCircle")
            .attr("fill", "none")
            .style("stroke", witness.color)
            .style("stroke-width", 3)
            .style("stroke-dasharray", "3, 3")
            .style("user-select", "none")
            .attr("cx", xscale(center.x))
            .attr("cy", yscale(center.y))
            .attr("r", r);
        // circle.append("text")
        //     .attr('text-anchor', 'middle')
        //     .text(`${i}`)
        //     .attr("id", `circle_label_${i}_${witness_id}`)
        //     .style("user-select", "none")
        //     .attr("x", xscale(center.x) + r)
        //     .attr("y", yscale(center.y) + 10 * i);
    }
}

function drawBunch(point) {
    console.log(`Drawing bunch around ${point.id}`);
    const bunch = data.B[point.id];
    console.log(bunch, data.p[point.id]);
    for (let bunch_id of bunch) {
        if (bunch_id == point.id) continue;
        const bunch_node = data.A[0][bunch_id];
        // const d = data.distances[point.id][bunch_id];
        drawLine(point, bunch_node, { class_id: `bunch_${point.id}`, color: "lightgrey" });
    }
}


function handleClick(point) {
    console.log(`Clicked ${point.id}`);
    // Clear old state
    if (data.u !== null) {
        clearBunch(data.u);
        unlabelPoint(data.u, "u");
    }
    // Update u
    data.u = point;
    labelPoint(point, "u");

    // Draw new state
    drawBunch(data.u);
    drawCircle(data.u);
}

function labelPoint(point, label) {
    svg.append("text")
        .attr('text-anchor', 'middle')
        .text(label)
        .attr("id", `point_${point.id}_label_${(label === "p(v)") ? "p" : label}`)
        .style("user-select", "none")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .attr("x", xscale(point.x) + 20)
        .attr("y", yscale(point.y) + ((label === "p(v)") ? -20 : 20));
}

function unlabelPoint(point, label) {
    if (label === "p(v)") label = "p";
    svg.select(`#point_${point.id}_label_${label}`).remove();
}

function handleMouseOver(point) {
    console.log(`Moused over ${point.id}`);
    data.v = point;
    labelPoint(point, "v");
    // if (data.u !== null) {
    // }
    drawBunch(data.v);
    drawCircle(data.v);
    labelPoint(data.A[0][Object.entries(data.p[point.id]).reverse()[0][1]], "p(v)");

}

function handleMouseOut(point) {
    console.log(data.u, data.v, point.id);
    console.log(`Moused out ${point.id}`);

    if (point !== data.u) {
        unselectPoint(point, "u");
        unlabelPoint(point, "u");
    }
    clearLines();
    if (data.v === point) {
        data.v = null;
        unlabelPoint(point, "v");
        const p_v = data.A[0][Object.entries(data.p[point.id]).reverse()[0][1]];
        console.log(p_v);
        unlabelPoint(p_v, "p(v)");// I can't figure this part out :(

    }

    // unlabelPoint(data.w, "w");
    // document.getElementById("uv_actual").innerHTML = "";
    // document.getElementById("uv_estimate").innerHTML = "";
    // document.getElementById("uw_actual").innerHTML = "";
    // document.getElementById("wv_actual").innerHTML = "";
}


main();
