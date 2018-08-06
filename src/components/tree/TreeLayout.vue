<template>
    <svg id="treeSvg" width="900" height="900">
        <g id="wrapper" class="wrapper">
            <g class="links"></g>
            <g class="nodes"></g>
            <g class="cols"></g>
        </g>
        <g id="axisX" class="axis axisX"></g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';
    import {mapActions} from 'vuex';

    import * as types from '../../store/types_treedata';

    export default {
        name: "treelayout",
        props: ['jsonData'],
        data() {
            return {
                rootNode: null,
                selectedNode: null,
                i: 0,
                counter: 0,
                duration: 750,
                rootNodeX: 100,
                rootNodeY: 0,
                topPaddingY: 120,
                rowHeight: 40,
                scaleX: 1.0,
                scaleY: 1.0,
                content: null,
                circle: null,
                alreadyUpdated: false,
                axisHeight: 800,
                treeDepth: 3
            }
        },
        mounted() {
            var svg = d3.select('#treeSvg');
            var g = svg.select("#wrapper");

            svg.call(this.setZoomListener(g));

            g.transition().duration(500)
                .attr("transform", (d) => {
                    return "translate(" + this.rootNodeX + "," + 0 + ")";
                });


            console.log("Tree Layout Mounted");
            if(this.jsonData !== null) {
                this.rootNode = this.jsonData;
                this.initTree();
                this.updateTree(this.rootNode);
            }
            this.renderXAxis();
            //console.log(this.content);
        },
        methods: {
            ...mapActions({
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
                stateTreeNodes: types.TREE_ACTION_SET_NODES
            }),
            initTree() {
                //d3.tree() -- Position Y is according to depth
                //d3.cluster() - Position Y ignores depth
                var treeLayout = d3.tree()
                    .size([800, 800]);
                // Put the root node, and all it's nested children inside a tree layout
                // Adds d.y and d.x which gives the positions for the rootNode
                // and it's nested children inside the tree layout
                treeLayout(this.rootNode);

                //console.log(this.rootNode);
                //x0 & y0 keep track of previous positions for each node
                this.rootNode.x0 = this.rootNode.x;
                this.rootNode.y0 = this.rootNode.y;
            },
            //~~~~~~~~~~~~~~~~~~~~ Tree Methods ~~~~~~~~~~~~~~~~~~~~~~~//
            clickNode(d) {
                if (d3.event.defaultPrevented) return; // click suppressed
                d = this.toggleChildren(d);
                this.alreadyUpdated = false;
                this.initTree();
                this.updateTree(d);
                //centerNode(d);
            },
            toggleChildren(d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else if (d._children) {
                    d.children = d._children;
                    d._children = null;
                }
                return d;
            },
            setCustomPositionX(d) {
                if (d.depth == 0) {
                    d.x = this.topPaddingY + 0;
                }
                if (d.dfId) {
                    d.x = this.topPaddingY + d.dfId * this.rowHeight;
                }
            },
            /**
             * The nodes in d.y is placed from 0-800 (width of tree).
             * So, if depth is just two, it is placed at (0,800)
             * if depth is 3, it is (0,400,800)
             * So, if we have branch-length, the distance is reduced by the scale of branch length
             * @param d
             */
            setCustomPositionY(d, tree_depth) {
                var treeWidth = 800;
                var defaultLength = treeWidth/tree_depth;

                if(d.depth > 0) {
                    var branchScale = d.data.branch_length;
                    var actualLength = defaultLength * branchScale;

                    //console.log(d.parent.data.accession + ": " + d.parent.y);
                    d.y = d.parent.y; //Should be previous node's position

                    if(actualLength === 0) actualLength = 5;
                    d.y = d.y + actualLength;

                }
                // if(d.depth > 1) {
                //     d.y = d.y - 150;
                //     let branch_length_scaled = 150*d.data.branch_length;
                //     if(branch_length_scaled === 0) branch_length_scaled = 20;
                //     d.y = d.y + branch_length_scaled;
                // }
            },
            updateTree(source) {
                if(this.alreadyUpdated) return;
                this.alreadyUpdated = true;

                var nodes = this.rootNode.descendants();

                this.counter = 0;
                this.calculateDepthFirstIds(nodes[0]);
                // console.log("Test");
                //this.updateTableData(nodes);

                var final_depth = 0;
                //Calculate depth of tree
                nodes.forEach(d => {
                    if(d.depth > final_depth) {
                        final_depth = d.depth;
                    }
                });
                this.treeDepth = final_depth;

                //Arrange nodes position by depth ids.
                nodes.forEach(d => {
                    this.setCustomPositionX(d);
                    this.setCustomPositionY(d, final_depth);
                });
                // console.log(nodes);

                //Join all nodes (g.node) with the 'rootnode' data we created from csv
                //Add id for all nodes, so that they 'enter' in order they were created.
                var nodesWithData = d3.select('.nodes')
                    .selectAll('g.node')
                    .data(nodes, d => {
                        return d.id || (d.id = ++this.i);
                    });

                this.renderNodes(nodesWithData, source);

                var links = d3.select('.links')
                    .selectAll('path')
                    .data(nodes.slice(1), function (d) {
                        return d.id;
                    });

                this.renderLinks(links, source);

                this.stateTreeNodes(nodes);

                // Store the old positions for transition.
                nodes.forEach(function (d) {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });

                this.$emit('updated-tree', nodes);
            },
            renderNodes(nodesData, source) {
                nodesData.selectAll('circle')
                    .style("fill", function (d) {
                        return d._children ? "black" : "#fff";
                    });

                const enteringNodes = nodesData.enter()
                    .append('g');
                const exitingNodes = nodesData.exit();

                //All entering nodes start at source's position
                // and transition to there current position.
                enteringNodes
                    .classed('node', true)
                    .attr("transform", function (d) {
                        return "translate(" + source.y0 + "," + source.x0 + ")";
                    })
                    .on('click', this.clickNode);

                enteringNodes
                    .append('circle')
                    .attr('r', 5)
                    .classed("normal_circle", true)
                    .classed("dup_circle", (d) => {
                        if(d.data.node_type) {
                            if(d.data.node_type == "DUPLICATION") {
                                return true;
                            }
                        } else {
                            return false;
                        }
                    })
                    .classed('leaf_circle', d => d.data.organism)
                    .style("fill", function (d) {
                        return d._children ? "black" : "#fff";
                    });

                // enteringNodes
                //     .append('rect')
                //     .attr('width',2000)
                //     .attr('height',40)
                //     .style('fill', function (d) {
                //         return d.depth%2==0 ? "black" : "grey";
                //     });

                // Add labels for the nodes

                enteringNodes.append('text')
                    .attr("dy", ".35em")
                    .attr("x", function (d) {
                        return d.children || d._children ? -13 : 13;
                    })
                    .attr("text-anchor", function (d) {
                        return d.children || d._children ? "end" : "start";
                    })
                    .text(function (d) {
                        //console.log(d);
                        var text = d.id;
                        text = "";
                        if(d.data.organism) {
                            text += " " + d.data.organism;
                        } else if(d.data.accession) {
                            text += " " + d.data.accession;
                            if(d.data.reference_speciation_event) {
                                text += " (" + d.data.reference_speciation_event + ")";
                            }
                        }

                        return text;
                    })
                    .style("fill-opacity", 0);

                //this.renderText(enteringNodes);

                //Update
                var updatedNodes = enteringNodes.merge(nodesData);
                // Transition to the proper position for the node from source (x0,y0)
                updatedNodes.transition()
                    .duration(this.duration)
                    .attr("transform", d => {
                        //console.log(d.x);
                        return "translate(" + d.y + "," + d.x + ")";
                    });
                updatedNodes.select("text")
                    .transition()
                    .duration(this.duration)
                    .style("fill-opacity", 1);

                // Remove any exiting nodes
                var nodeExits = exitingNodes.transition()
                    .duration(this.duration)
                    .attr("transform", function (d) {
                        return "translate(" + source.y + "," + source.x + ")";
                    })
                    .remove();
                // On exit reduce the node circles size to 0
                nodeExits.select('circle')
                    .attr('r', 1e-6);
                nodeExits.select("text")
                    .style("fill-opacity", 0);
            },
            renderLinks(linksData, source) {
                const enteringLinks = linksData.enter()
                    .insert('path', "g");
                const exitingLinks = linksData.exit();

                //All entering links start at source's position
                // and transition to there current position.
                enteringLinks
                    .attr('d', d => {
                        var o = {x: source.x0, y: source.y0}
                        return this.diagonal(o, o);
                    })
                    .classed('normal_path', true)
                    .classed('dup_path', d => {
                      //console.log(d.data);
                      if(d.data.node_type) {
                          if(d.data.node_type == "DUPLICATION") {
                              return true;
                          }
                      } else {
                          return false;
                      }
                    })
                    .classed('leaf_path', d => d.data.organism)
                    .on("mouseover", this.mouseOver)
                    .on("mousemove", this.mousePoint)
                    .on("mouseleave", this.mouseLeave);

                //Update
                var updatedLinks = enteringLinks.merge(linksData);

                // Transition to the proper position for the node
                updatedLinks.transition()
                    .duration(this.duration)
                    .attr('d', d => {
                        return this.diagonal(d, d.parent)
                    });

                // Remove any exiting links
                var linkExits = exitingLinks.transition()
                    .duration(this.duration)
                    .attr('d', d => {
                        var o = {x: source.x, y: source.y};
                        return this.diagonal(o, o)
                    })
                    .remove();
            },
            diagonal(s, d) {
                var log = "M" + s.y + "," + s.x
                    + "C" + (s.y + d.y) / 2 + "," + s.x
                    + " " + (s.y + d.y) / 2 + "," + d.x
                    + " " + d.y + "," + d.x;
                //console.log(log);
                return "M" + s.y + "," + s.x
                    + "C" + (s.y + d.y) / 2 + "," + s.x
                    + " " + (s.y + d.y) / 2 + "," + d.x
                    + " " + d.y + "," + d.x;
            },
            calculateDepthFirstIds(d) {
                //console.log("I: " + d.id);
                if (d.children) {
                    d.children.forEach(c => {
                        this.counter++;
                        c.dfId = this.counter;
                        this.calculateDepthFirstIds(c, this.counter);
                    });
                }
            },
            mousePoint(d) {
                //console.log(d);
                var _x = d3.mouse(d3.event.currentTarget)[0];
                var _y = d3.mouse(d3.event.currentTarget)[1];
                // this.circle
                //     .attr("cx", _x+ 20)
                //     .attr("cy", _y);
            },
            mouseOver(d) {
              //console.log("Over ", e);
              //this.circle.transition().duration(200).style("opacity", "1");
                this.$emit('mouse-over-link', d);
                var nodes = [{x: d.x, y: d.y}];
                this.dropVerticalLine(nodes);
            },
            mouseLeave(d) {
                //console.log('Leave');
                //this.circle.transition().duration(200).style("opacity", "0");
                this.$emit('mouse-leaves-link', d);
                var nodes = [];
                this.dropVerticalLine(nodes);
            },
            setZoomListener(g) {
                return d3.zoom().scaleExtent([this.scaleX, this.scaleY])
                    .on("zoom", () => {
                        g.attr("transform", d3.event.transform);
                        // //console.log(d3.event.transform.k);
                        // this.stateTreeZoom(d3.event.transform.k);
                    })
                    .on("end", () => {
                        //console.log(d3.event.transform.y);
                        this.rootNodeX = d3.event.transform.x;
                        this.rootNodeY = d3.event.transform.y;
                        this.renderXAxis();
                        this.stateTreeZoom(d3.event.transform);

                        // var nodes = this.rootNode.descendants();
                        // this.stateTreeNodes(nodes);
                        //console.log(d3.event.transform.y);
                    })
            },
            renderXAxis() {
                var xAxis = d3.select("#axisX");
                var x = d3.scaleLinear().domain([0, this.treeDepth]).range([0,800]);
                xAxis
                    .transition().duration(200)
                    .attr("transform", "translate(" + this.rootNodeX + "," + this.axisHeight + ")")
                    .call(d3.axisBottom(x).ticks(10));
            },
            dropVerticalLine(nodes) {
                var colsData = d3.select(".cols")
                    .selectAll('path')
                    .data(nodes);
                //
                var enteringCols = colsData.enter()
                    .insert('path', "g");
                var exitingCols = colsData.exit();

                //All entering rows start at source's position
                // and transition to there current position.
                enteringCols
                    .attr('d', d => {
                        return this.straightVert(d, d.x-this.rootNodeY);
                    })
                    .attr('stroke', 'black')
                    .attr('stroke-width', '2')
                    .attr('fill', 'none');

                //Update
                var updatedCols = enteringCols.merge(colsData);

                // Transition to the proper position for the node
                updatedCols.transition()
                    .duration(this.duration)
                    .attr('d', d => {
                        return this.straightVert(d, 800-this.rootNodeY);
                    });

                // Remove any exiting links
                exitingCols
                    .transition()
                    .duration(this.duration)
                    .attr('d', d => {
                        return this.straightVert(d, d.x)
                    })
                    .remove();
            },
            straightVert(s, dest) {
                //console.log(s.y);
                return "M" + s.y + "," + s.x
                    + "L" + s.y + "," + dest;
            },
            setDragListener(g) {
                return d3.drag().on("start", () => {

                })
                    .on("drag", () => {

                    })
                    .on("end", () => {
                        //console.log("End");
                    });
            }
        },
        watch: {
            content: {
                handler: function (val, oldVal) {
                    //console.log("C: ", val);
                },
                deep: true
            },
            jsonData: {
                handler: function (val, oldVal) {
                    this.rootNode = val;
                    // console.log(this.rootNode);
                    this.initTree();
                    this.updateTree(this.rootNode);
                }
            }
        }
    }
</script>

<style>
    #treel{
        z-index: 1;
        background-color: #c4e3f3;
    }
    text {
        font-family: 'Lato';
        font-weight: bold;
    }
    .normal_path {
        fill: none;
        stroke: steelblue;
        stroke-width: 5;
    }
    .normal_path:hover {
        stroke: orange
    }

    .dup_path {
        fill: none;
        stroke: #de7d7d;
    }
    .dup_path:hover {
        stroke: orange
    }

    .leaf_path {
        fill: nonoe;
        stroke: #D4AC1C;
        stroke-width: 3;
    }
    .leaf_path:hover {
        stroke: orange
    }

    .node {
        cursor: pointer;
    }

    .normal_circle {
        stroke: steelblue;
        stroke-width: 2px;
    }
    .dup_circle {
        stroke: #de7d7d;
        stroke-width: 2.5px;
    }
    .leaf_circle {
        stroke: #D4AC1C;
        stroke-width: 2.5px;
    }

    .ghostCircle, .activeDrag .ghostCircle {
        display: none;
    }

    .ghostCircle.show {
        display: block;
    }
    .axisX {


    }
    rect {
        fill: black;
        stroke: #000;
        stroke-width: 0.1px;
        stroke-opacity: 0.3;
        fill-opacity: 0.3;
    }
</style>

