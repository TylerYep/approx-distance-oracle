const svg = d3.select("#part3");
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

const k = 5;
const NUM_POINTS = 15;
let selected = [];
let frozenCircle = false;

// ADO CODE

function createRandomPoints() {
    const ORIGIN = { x: 5, y: 0 };
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


// END OF ADO CODE

let data = [];

function main() {
    const pointData = createRandomPoints();
    const A = createKSubsets(pointData);
    const tableData = generateTableData(A, pointData);
    for (i = 0; i < pointData.length; i++) {
        const witnesses = tableData[i];
        data.push({ ...pointData[i], witnesses });
    }
    drawPoints(data);
}

function generateTableData(A, pointData) {
    let tableData = [];
    for (let v = 0; v < NUM_POINTS; v++) {
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

function drawPoints(pointData) {
    const DOTSIZE = 10;

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
                .on("click", handleClick)
            // .on("mouseover", function (_) {
            //     // Needs to be a function to have access to "this".
            //     d3.select(this).style("fill", ON_COLOR);
            // })
            // .on("mouseout", function (_) {
            //     // Needs to be a function to have access to "this".
            //     d3.select(this).style("fill", d => d.color);
            // });
            enter.append("text")
                .attr("class", d => "label" + d.id)
                .style("text-anchor", "middle")
                .style("user-select", "none")
                .attr("x", d => xscale(d.x) + 20)
                .attr("y", d => yscale(d.y) + 10)
                .text((_, i) => i);
        },
        // update allows you to call drawPoints() again, and instead of creating brand new points,
        // skip the enter => code and do just this instead.
        // raise() moves the points to the top layer of the SVG, kind of like z-index
        update => update.raise()
        // You can also add a custom remove => function
        // remove => remove.do stuff
    );
}

let u = null;
let v = null;
let w = null;


function clearLines() {
    d3.selectAll(".line_group").remove();
}

function unselectPoint(point) {
    if (point !== u) {
        clearBunch(point);
        clearCircle(point);
    }
}

function clearBunch({ id }) {
    d3.select(`#bunch_${id}`).remove();
}

function clearCircle({ id }) {
    d3.select(`#circle_${id}`).remove();
}

function drawLine(start, end, label = "", color = "black") {
    console.log(`Drawing line between ${start.id} and ${end.id}`);
    let line = svg.append("g").attr("class", "line_group");
    line.append('line')
        .style("stroke", color)
        .style("stroke-width", 1)
        .attr("x1", xscale(start.x))
        .attr("y1", yscale(start.y))
        .attr("x2", xscale(end.x))
        .attr("y2", yscale(end.y))
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

function drawCircle(center, color = "red") {
    const witnesses = data[center.id]["witnesses"];
    let circle = svg.append("g")
        .attr("class", "circle_group")
        .attr("id", `circle_${center.id}`)
        .lower();
    for (let [i, witness_id] of Object.entries(witnesses)) {
        let witness = data[witness_id];
        const r = (center.id != witness_id) ?
            xscale(Math.sqrt(squaredDist(center, witness))) : 20;
        circle.append("circle")
            .attr("class", "bigCircle")
            .attr("fill", color)
            .style("stroke", "black")
            .style("stroke-dasharray", "3, 3")
            .attr("opacity", 0.1)
            .style("user-select", "none")
            .attr("cx", xscale(center.x))
            .attr("cy", yscale(center.y))
            .attr("r", r);
        circle.append("text")
            .attr('text-anchor', 'middle')
            .text(`${i}`)
            .attr("id", `circle_label_${i}_${witness_id}`)
            .style("user-select", "none")
            .attr("x", xscale(center.x) + r)
            .attr("y", yscale(center.y) + 10 * i);
    }
}

function drawBunch(point) {
    // TODO: Create smooth polygon convex hull around points in bunch
    // http://bl.ocks.org/hollasch/9d3c098022f5524220bd84aae7623478
}

function query(u, v) {
    // TODO
}

function handleClick(point) {
    console.log(`Clicked ${point.id}`);
    console.log(point);
    // Clear old state
    clearBunch(point);
    clearCircle(point);
    // Update u
    u = point;
    // Draw new state
    drawBunch(u);
    drawCircle(u, "blue");
}


function handleMouseOver(point) {
    console.log(`Moused over ${point.id}`);
    v = point;
    drawBunch(v);
    drawCircle(v, "red");
    if (u !== null) {
        // WIP
        // second point being clicked (v)
        // w, estimate = query(u, v);
        const estimate = 0;
        // drawLine(u, w, `${squaredDist(u, w)}`);
        // drawLine(v, w, `${squaredDist(v, w)}`);
        drawLine(u, v, `Estimate: ${estimate} (Actual: ${squaredDist(u, v).toFixed(1)})`);
    }
    d3.select(this).style("fill", ON_COLOR);
}

function handleMouseOut(point) {
    console.log(`Moused out ${point.id}`);
    unselectPoint(v);
    clearLines();
    v = null;
    d3.select(this).style("fill", () => point.color);
}



// function drawCircles(centerPointData, radiusPoint = []) {
//     svg.selectAll(".bigCircle").data(d3.zip(centerPointData, radiusPoint), d => d[0].id).join(
//         enter => {
//             enter.append("circle")
//                 .attr("class", "bigCircle")
//                 .attr("fill", "red")
//                 .style("stroke", "black")
//                 .style("stroke-dasharray", "3, 3")
//                 .attr("opacity", 0.25)
//                 .attr("cx", d => xscale(d[0].x))
//                 .attr("cy", d => yscale(d[0].y))
//                 .attr("r", d =>
//                     (d[0].id != d[1].id) ? xscale(Math.sqrt(squaredDist(d[0], d[1]))) : 20
//                 );
//         },
//         update => update.attr("r", d =>
//             (d[0].id != d[1].id) ? xscale(Math.sqrt(squaredDist(d[0], d[1]))) : 20
//         )
//     );
// }


main();
