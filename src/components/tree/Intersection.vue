<template>
    <svg id="intersect" width="900" height="900">
        <g class="circle">
            <circle></circle>
        </g>
        <g class="polygon">
            <path></path>
        </g>
        <g class="curved">
            <path></path>
        </g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        name: "intersect",
        data() {
            return {

            }
        },
        mounted() {
            var svg = d3.select("#intersect");
            var circle = svg.select("g.circle")
                .select("circle")
                .datum([900 / 2, 900 / 2, 10])
                    .call(this.positionCircle)
                    .attr("r", function(d) { return d[2]; });

            var polygon = svg.select("g.polygon")
                .datum([[500, 300], [600, 300], [600, 400], [500, 400]]);
            polygon.select("path")
                .call(this.positionPath);

            var polygon2 = svg.select('g.curved')
                .datum([[400,160], [0,120]]);

            polygon2.select('path')
                .attr('d', d => {
                    var x2 = d[1][1];
                    var y2 = d[1][0];
                    var d = {x: d[0][1], y: d[0][0]};
                    var s = {x: x2, y: y2};
                    console.log(d);
                    return this.diagonal(d, s);
                });

            var self = this;
            circle.call(d3.drag().on("drag", function(d) {
                d[0] = d3.event.x, d[1] = d3.event.y;
                d3.select(this)
                    .attr("cx", function(d) { return d[0]; })
                    .attr("cy", function(d) { return d[1]; })
                if(self.intersects(circle.datum(), polygon2.datum())) {
                    circle
                        .style("fill", "red");
                } else {
                    circle
                        .style("fill", "steelblue");
                }
            }));

            polygon2.selectAll("circle")
                .data(function(d) {
                    return d;
                })
                .enter().append("circle")
                    .call(this.positionCircle)
                    .attr("r", 4.5)
                    .call(d3.drag()
                            .on("drag", function(d) {
                                d[0] = d3.event.x, d[1] = d3.event.y;
                                d3.select(this)
                                    .attr("cx", function(d) { return d[0]; })
                                    .attr("cy", function(d) { return d[1]; })
                                polygon2.select("path")
                                    // .call(self.positionPath);
                                    .attr('d', d => {
                                        var x2 = d[1][1];
                                        var y2 = d[1][0];
                                        var d = {x: d[0][1], y: d[0][0]};
                                        var s = {x: x2, y: y2};
                                        return self.diagonal(d, s);
                                    });

                                if(self.intersects(circle.datum(), polygon2.datum())) {
                                    circle
                                        .style("fill", "red");
                                } else {
                                    circle
                                        .style("fill", "steelblue");
                                }
                            }));


        },
        methods: {
            positionCircle(circle) {
                circle
                    .attr("cx", function(d) { return d[0]; })
                    .attr("cy", function(d) { return d[1]; });
            },
            positionPath(path) {
                path
                    .attr("d", function(d) { return "M" + d.join("L") + "Z"; });
            },
            intersects(circle, polygon) {
                return this.pointInPolygon(circle, polygon)
                    || this.polygonEdges(polygon).some((line) => {
                        return this.pointLineSegmentDistance(circle, line) < circle[2];
                    });
            },
            polygonEdges(polygon) {
                return polygon.map(function(p, i) {
                    return i ? [polygon[i - 1], p] : [polygon[polygon.length - 1], p];
                });
            },
            pointInPolygon(point, polygon) {
                for (var n = polygon.length, i = 0, j = n - 1, x = point[0], y = point[1], inside = false; i < n; j = i++) {
                    var xi = polygon[i][0], yi = polygon[i][1],
                        xj = polygon[j][0], yj = polygon[j][1];
                    if ((yi > y ^ yj > y) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
                }
                return inside;
            },
            pointLineSegmentDistance(point, line) {
                var v = line[0], w = line[1], d, t;
                return Math.sqrt(this.pointPointSquaredDistance(point, (d = this.pointPointSquaredDistance(v, w))
                    ? ((t = ((point[0] - v[0]) * (w[0] - v[0]) + (point[1] - v[1]) * (w[1] - v[1])) / d) < 0 ? v
                        : t > 1 ? w
                            : [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])])
                    : v));
            },
            pointPointSquaredDistance(v, w) {
                var dx = v[0] - w[0], dy = v[1] - w[1];
                return dx * dx + dy * dy;
            },
            diagonal(s, d) {
                var log = "M" + s.y + "," + s.x
                    + "C" + (s.y + d.y) / 2 + "," + s.x
                    + " " + (s.y + d.y) / 2 + "," + d.x
                    + " " + d.y + "," + d.x;
                return log;
            }
        }
    }
</script>

<style scoped>
    .circle {
        stroke: steelblue;
        stroke-width: 2px;
        fill: #fff;
        cursor: pointer;
    }

    .circle.intersects {
        fill: green;
    }

    .polygon path {
        fill: #000;
        fill-opacity: .3;
    }

    .polygon circle {
        fill: steelblue;
        stroke: #fff;
        cursor: move;
    }

    circle {
        fill: steelblue;
        stroke: #fff;
        cursor: move;
    }
    .curved path {
        fill: none;
        stroke: steelblue;
        stroke-width: 5;
    }
    .curved path:hover {
        cursor: pointer;
        stroke: orange
    }
</style>
