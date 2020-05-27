const MAP_WIDTH = 1100;
const MAP_HEIGHT = 500;
const COLORS = ['#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD', '#8C564B', '#CFECF9', '#7F7F7F', '#BCBD22', '#17BECF']; // Tableau-10
const TOKEN = 'pk.eyJ1IjoidHlsZXJ5ZXAiLCJhIjoiY2s3ZnQ5cGZmMDZmMTNvcGd1amFrOGV3ciJ9.32mOM4QHLL9QKl0TpUZvZw'

mapboxgl.accessToken = TOKEN;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    zoom: 11,
    maxZoom: 15,
    minZoom: 9,
    center: [-122.061578, 37.385532]
});
// map.addControl(new mapboxgl.NavigationControl(), 'top-right');

const svg = d3.select("#vis")
    .attr("width", MAP_WIDTH)
    .attr("height", MAP_HEIGHT)
    .style("pointer-events", "none");
const margin = {top: 20, right: 20, bottom: 50, left: 60};

let accidentData;
let pathPoints = [];
let linePointPairs = [];

const DEFAULT_COLOR = "orange";
const ON_COLOR = "blue";
const OFF_COLOR = "gray";

function main() {
    d3.csv("data/accidents_bay_area_no_duplicates.csv", d => {
        // parse rows, +symbol means to treat data as numbers
        return {
            id: d.ID,
            name: d.Description,
            address: d.Street,
            severity: +d.Severity,
            latitude: +d.Start_Lat,
            longitude: +d.Start_Lng,
            count: +d.Count
        };
    }).then(data => {
        accidentData = data;
        registerCallbacks();

        map.on("viewreset", render);
        map.on("move", render);
        render();
    });
}


function render() {
    const projection = getMapBoxProjection();
    drawPoints(projection);
    updateLines(projection);
}


function getMapBoxProjection() {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const scale = 512 * 0.5 / Math.PI * Math.pow(2, zoom);

    // Set up projection that the map is using
    // This maps between <longitude, latitude> position to <x, y> pixel position on the map
    // projection is a function and it has an inverse:
    // projection([lon, lat]) returns [x, y]
    // projection.invert([x, y]) returns [lon, lat]
    const projection = d3.geoMercator()
        .center([center.lng, center.lat])
        .scale(scale)
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
    return projection;
}


function registerCallbacks() {
    document.getElementById("resetBtn").addEventListener("click", () => {
        pathPoints = [];
        linePointPairs = [];
        render();
        svg.selectAll(".lines").remove();
    });
}


function updateLines(projection) {
    svg.selectAll(".lines").data(linePointPairs).join(
        enter => enter.append("line")
            .attr("class", "lines")
            .attr("stroke-width", 5)
            .attr("x1", d => projection(d[0])[0])
            .attr("y1", d => projection(d[0])[1])
            .attr("x2", d => projection(d[1])[0])
            .attr("y2", d => projection(d[1])[1])
            .style("stroke", (_, i) => COLORS[i % COLORS.length]),
        update => update
            .attr("x1", d => projection(d[0])[0])
            .attr("y1", d => projection(d[0])[1])
            .attr("x2", d => projection(d[1])[0])
            .attr("y2", d => projection(d[1])[1])
    );
}


async function drawLines(projection) {
    const url = "https://api.mapbox.com/directions/v5/mapbox/driving/"
                + `${pathPoints[0].longitude},${pathPoints[0].latitude};`
                + `${pathPoints[1].longitude},${pathPoints[1].latitude}`
                + `?geometries=geojson&access_token=${TOKEN}`;
    const response = await fetch(url);
    const routeData = await response.json();
    console.log(routeData);

    const points = routeData.routes[0].geometry.coordinates;
    linePointPairs = d3.pairs(points);
    updateLines(projection);

    let accumulatedDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const distance = latLongDistance(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
        accumulatedDistance += distance;
    }
}


function latLongDistance(lon1, lat1, lon2, lat2) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
    const radlat1 = Math.PI * lat1/180;
    const radlat2 = Math.PI * lat2/180;
    const theta = lon1 - lon2;
    const radtheta = Math.PI * theta/180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2)
        + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344;
    return dist;
}


function colorPoints(d) {
    for (let i = 0; i < pathPoints.length; i++) {
        if (pathPoints[i] == d) {
            return ON_COLOR;
        }
    }
    return DEFAULT_COLOR;
}


function countPointsNearLine(p1, p2) {
    const DELTA = 0.001; // Roughly 100m
    let filteredData = filteredData.filter(d =>
        Math.min(p1[0], p2[0]) - DELTA <= d.longitude
        && d.longitude <= Math.max(p1[0], p2[0]) + DELTA
        && Math.min(p1[1], p2[1]) - DELTA <= d.latitude
        && d.latitude <= Math.max(p1[1], p2[1]) + DELTA
    );
    return filteredData.length;
}


function drawPoints(projection) {
    const DOT_SIZE = 3;
    let filteredData = accidentData.filter(d => {
        const [x, y] = projection([d.longitude, d.latitude]);
        return x >= 0 && y >= 0 && x <= MAP_WIDTH && y <= MAP_HEIGHT;
    });

    svg.selectAll(".points").data(filteredData, d => d.id).join(
        enter => enter.append("circle")
            .attr("class", "points")
            .attr("opacity", 0.6)
            .style("fill", colorPoints)
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr("cy", d => projection([d.longitude, d.latitude])[1])
            .attr("r", DOT_SIZE)
            .style("pointer-events", "all")
            .on("click", function(d) {
                // Needs to be a function to have access to "this".
                if (pathPoints.length < 2) {
                    pathPoints.push(d);
                    d3.select(this).style("fill", ON_COLOR);
                    if (pathPoints.length == 2) {
                        const projection = getMapBoxProjection();
                        drawLines(projection);
                    }
                }
            }),
        update => update.style("fill", colorPoints)
            .attr("cx", d => projection([d.longitude, d.latitude])[0])
            .attr("cy", d => projection([d.longitude, d.latitude])[1])
    );
}


main()
