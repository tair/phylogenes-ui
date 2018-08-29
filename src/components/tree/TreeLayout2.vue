<template>
    <svg id="treeSvg" width="100%" height="900">
        <g id="wrapper" class="wrapper">
            <g class="links">
                <treelink v-for="link in treelinks" :key="link.id"
                          ref="treelink"
                          :content="link">
                </treelink>
            </g>
            <g class="nodes">
                <treenode v-for="node in treenodes" :id="node.id"
                          ref="treenode"
                          :content="node"
                          v-on:clicknode="onClick"></treenode>
                <treenode2 v-for="node in treenodes2" :id="node.id"
                           ref="treenode"
                           :content="node"
                           v-on:clicknode="onClick"></treenode2>
            </g>

            <dragnode ref="nodeToAdd" :content="exampleNode"
                      v-on:dragging="onDrag"
                      v-on:dragend="onDragEnd"></dragnode>
        </g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';
    import Vue from 'vue';
    import treenode from '../tree/TreeNode';
    import treenode2 from '../tree/TreeNode2';
    import dragnode from '../tree/DraggableTreeNode';
    import treelink from '../tree/TreeLink';

    export default {
        name: "treelayout2",
        props: ['jsonData'],
        components: {
            'treenode': treenode,
            'treenode2': treenode2,
            'dragnode': dragnode,
            'treelink': treelink
        },
        data() {
            return {
                treeData: {
                    id: 1,
                    name: "One",
                    children: [
                        {
                            id: 11,
                            name: "Eleven",
                            children: [
                                {
                                    id: 111,
                                    name: "OneOneOne",
                                    children: [
                                        {
                                            id: 1111,
                                            name: "1111"
                                        },
                                        {
                                            id: 1112,
                                            name: "1112"
                                        }
                                    ]
                                },
                                {
                                    id: 112,
                                    name: "OneOneTwo"
                                }
                            ]
                        },
                        {
                            id: 12,
                            name: "Twelve",
                            children: [
                                {
                                    id: 121,
                                    name: "121"
                                }
                            ]
                        },
                    ]
                },
                exampleNode: {
                    id: 1,
                    text: "Example",
                    x: 400,
                    y: 400,
                    xo: 400,
                    yo: 400
                },
                treenodes: [],
                treenodes2: [],
                treelinks: [],
                linkDatums: [],
                rootNode: null,
                oldIndexes: [],
                scale: {x: 1.0, y: 1.0},
                duration: 750,
                index: 0,
                counter: 0,
                topPaddingY: 120,
                rowHeight: 40,
                link_intersected: null
            }
        },
        mounted() {
            var svg = d3.select('#treeSvg');
            var g = svg.select("#wrapper");
            // g.transition().duration(500)
            //     .attr("transform", (d) => {
            //         return "translate(" + 100 + "," + 0 + ")";
            //     });

            svg.call(this.setZoomListener(g));

            // var nodes = d3.hierarchy(this.treeData, function(d) {
            //     return d.children;
            // });
            //
            // nodes.each(n => {
            //    if(!n.id) {
            //        n.id = this.index++;
            //    }
            // });

            if (this.jsonData != null) {
                this.initTree();
                // this.rootNode = nodes;
                // this.updateOldIndexes(this.rootNode.descendants());
                //
                // this.initTree();
                // this.updateTree(this.rootNode);
            }
        },
        methods: {
            cloneObject(obj) {
                var clone = {};
                for (var i in obj) {
                    if (obj[i] != null && typeof(obj[i]) == "object")
                        clone[i] = this.cloneObject(obj[i]);
                    else
                        clone[i] = obj[i];
                }
                return clone;
            },
            initTree() {
                //  assigns the data to a hierarchy using parent-child relationships
                this.rootNode = d3.hierarchy(this.jsonData, function (d) {
                    return d.children;
                });
                this.updateIdAndText();
                this.updateOldIndexes(this.rootNode.descendants());

                var treeLayout = d3.tree()
                    .size([800, 800]);

                treeLayout(this.rootNode);

                this.updateTree(this.rootNode);
            },
            getText(d) {
                var text = d.id;
                // text = "";
                if(!d.data) return null;
                if (d.data.organism) {
                    text += " " + d.data.organism;
                } else if (d.data.accession) {
                    text += " " + d.data.accession;
                    if (d.data.reference_speciation_event) {
                        text += " (" + d.data.reference_speciation_event + ")";
                    }
                }
                return text;
            },
            getLogs(n) {
                if (!n) {
                    console.log("Undefined");
                } else {
                    console.log("Id: " + n.id + " DataId: " + n.data.id);
                }
            },
            setZoomListener(g) {
                return d3.zoom().scaleExtent([this.scale.x, this.scale.y])
                    .on("zoom", () => {
                        g.attr("transform", d3.event.transform);
                    })
                    .on("end", () => {
                        // this.rootNodeX = d3.event.transform.x;
                        // this.rootNodeY = d3.event.transform.y;
                        // this.renderXAxis();
                        // this.stateTreeZoom(d3.event.transform);
                    })
            },
            updateIdAndText() {
                this.index = 0;
                this.rootNode.each(n => {
                    n.id = this.index++;
                    // console.log(n.id + " X: " + n.x);
                    var text = this.getText(n);
                    if (text != null) {
                        n.text = text;
                    }
                });

                var treeLayout = d3.tree()
                    .size([800, 800]);

                treeLayout(this.rootNode);
                setTimeout(() => {
                    // console.log(this.rootNode);

                }, 1000);
            },
            updateOldIndexes(nodes) {
                this.oldIndexes = [];
                nodes.forEach(n => {
                    this.oldIndexes.push(n);
                });
                // console.log("Index Size " + this.oldIndexes.length);
            },
            saveOldPositions(root) {
                root.each(d => {
                    d.xo = d.x;
                    d.yo = d.y;
                });
            },
            updateTree(source) {
                this.saveOldPositions(this.rootNode);

                //Explain: why old Indexes?
                d3.select('.nodes')
                    .selectAll('g')
                    .data(this.oldIndexes);
                // console.log(this.oldIndexes);

                var nodes = this.rootNode.descendants();
                this.updateAccordingToDepth(nodes);
                // console.log(nodes);

                this.renderLinks(nodes);

                var nodesData = d3.select('.nodes')
                    .selectAll('g')
                    .data(nodes, function (d) {
                        // console.log(d.id);
                        return d.id;
                    });

                const enteringNodes = nodesData.enter();
                const exitingNodes = nodesData.exit();
                const updatedNodes = enteringNodes.merge(nodesData);

                exitingNodes.nodes().forEach(n => {
                    if (n.__data__) {
                        var findNode = this.$refs.treenode.find(en => en.content.id == n.__data__.id);
                        // console.log(this.clickedNode.id + "-" + this.clickedNode.x + "," + this.clickedNode.y);
                        findNode.onExit(this.clickedNode);
                    }
                });

                var timeoutS = 0;
                if (exitingNodes.nodes().length > 0) {
                    timeoutS = this.duration;
                }

                setTimeout(() => {
                    this.treenodes.splice(0, this.treenodes.length);
                    this.treenodes2.splice(0, this.treenodes2.length);
                    setTimeout(() => {
                        var tempArray = [];
                        var tempArray2 = [];
                        updatedNodes.nodes().forEach(n => {
                            // console.log("N ", n.__data__);
                            var node_content = n.__data__;
                            // node_content.x0 = node_content.x;
                            // node_content.y0 = node_content.y;
                            if (n.constructor && n.constructor.name === "EnterNode") {
                                if (this.clickedNode) {
                                    // console.log("Click ", this.clickedNode.id);
                                    node_content.xo = this.clickedNode.x;
                                    node_content.yo = this.clickedNode.y;
                                }
                            }
                            if (n.__data__.children == null) {
                                // tempArray2.push(node_content);
                                tempArray.push(node_content);
                            } else {
                                tempArray.push(node_content);
                            }

                        });

                        tempArray.sort((a, b) => {
                            return b.id < a.id;
                        });
                        tempArray2.sort((a, b) => {
                            return b.id < a.id;
                        });
                        this.treenodes = tempArray;
                        this.treenodes2 = tempArray2;
                        this.updateOldIndexes(nodes);
                        this.addLinkDatums();
                    }, 1);
                }, timeoutS);
            },
            renderLinks(nodes) {
                d3.select('.links')
                    .selectAll('path')
                    .data(this.oldIndexes.slice(1));

                var linksData = d3.select('.links')
                    .selectAll('path')
                    .data(nodes.slice(1), function (d) {
                        return d.id;
                    });

                const enteringLinks = linksData.enter();
                const exitingLinks = linksData.exit();
                const updatedLinks = enteringLinks.merge(linksData);

                exitingLinks.nodes().forEach(n => {
                    if (n.__data__) {
                        var findLink = this.$refs.treelink.find(en => en.content.id == n.__data__.id);
                        findLink.onExit(this.clickedNode);
                    }
                });

                //Explain timeout
                var timeoutS = 0;
                if (exitingLinks.nodes().length > 0) {
                    timeoutS = this.duration;
                    // timeoutS = 2000;
                }

                setTimeout(() => {
                    this.treelinks.splice(0, this.treelinks.length);
                    setTimeout(() => {
                        //Explain temp array
                        var tempArray = [];
                        updatedLinks.nodes().forEach(n => {
                            var node_content = n.__data__;
                            node_content.enterLink = false;
                            if (n.constructor && n.constructor.name === "EnterNode") {
                                node_content.enterLink = true;
                            }
                            tempArray.push(node_content);
                        });

                        tempArray.sort((a, b) => {
                            return b.id < a.id;
                        });
                        this.treelinks = tempArray;
                    }, 1);
                }, timeoutS);
                // console.log(this.treelinks);
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Depth Position Logic ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateAccordingToDepth(nodes, flag) {
                this.counter = 0;
                this.calculateDepthFirstIds(nodes[0]);
                //Arrange nodes position by depth ids.
                nodes.forEach(d => {
                    this.setCustomPositionX(d);
                });
                // console.log(nodes[2]);
            },
            calculateDepthFirstIds(d) {
                if (d.children) {
                    d.children.forEach(c => {
                        this.counter++;
                        c.dfId = this.counter;
                        this.calculateDepthFirstIds(c, this.counter);
                    });
                }
            },
            setCustomPositionX(d) {
                if (d.depth == 0) {
                    d.x = this.topPaddingY + 0;
                }
                if (d.dfId) {
                    var newX = this.topPaddingY + d.dfId * this.rowHeight;
                    d.x = newX;
                }
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Depth Position Logic ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            addLinkDatums() {
                this.linkDatums = [];
                this.treenodes.forEach(n => {
                    if (n.children) {
                        n.children.forEach(cn => {
                            var linkNodes = [];
                            var node1 = [n.y, n.x];
                            var node2 = [cn.y, cn.x];
                            linkNodes.push(node1);
                            linkNodes.push(node2);
                            var linkData = {
                                datum: linkNodes,
                                n1: n.id,
                                n2: cn.id
                            }
                            this.linkDatums.push(linkData);
                        });
                    }
                });
                // console.log("Datum Length ", this.linkDatums);
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            onClick(source) {
                // console.log(source.id + "-" + source.x + "," + source.y);
                this.clickedNode = {id: source.id, x: source.x, y: source.y};
                this.updateTree(source);
            },
            onDrag(circle_datum) {
                this.link_intersected = this.linkDatums.find(ld => {
                    if (this.intersects(circle_datum, ld.datum)) {
                        return ld;
                    }
                });
                if (this.link_intersected) {
                    // console.log(link_intersected);
                    this.$refs.nodeToAdd.onIntersect(true);
                } else {
                    this.$refs.nodeToAdd.onIntersect(false);
                }
            },
            onDragEnd() {
                if (this.link_intersected) {
                    const nn = this.addNewNodeBetweenLink(this.link_intersected);
                    this.updateIdAndText();
                    this.updateTree(null);
                }
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            addNewNodeBetweenLink(link) {
                var nodes = this.rootNode.descendants();
                /**
                 * link - n1 [id] - Parent Node Id
                 *        n2 [id] - Child Node Id
                 */
                if(link) {
                    //Creates an intermediate node in between parent node and child node.
                    var pn = nodes[this.link_intersected.n1];
                    var cn = nodes[this.link_intersected.n2];
                    var nn = this.createNewNode(cn, pn);

                    var pn_children = pn.children.filter(cd => cd.id != cn.id);

                    cn.parent = nn;
                    cn.depth = cn.depth+1;
                    this.updateChildren(cn);

                    nn.id = cn.id;
                    nn.children = [];
                    nn.children.push(cn);

                    pn.children = pn_children;
                    pn.children.push(nn);
                    //Arrange children by id
                    pn.children.sort((a, b) => {
                        return b.id < a.id;
                    });
                }
                return nn;
            },
            updateChildren(n) {
                if(n.children) {
                    n.children.forEach(cn => {
                        cn.depth = cn.depth+1;
                        this.updateChildren(cn);
                    });
                }
            },
            createNewNode(n, pn) {
                var newNode = {
                    depth: n.depth,
                    enterLink: true,
                    children: null,
                    parent: pn,
                    text: "Sample Gene",
                    x: n.x,
                    y: n.y,
                };
                return newNode;
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Intersection Logic ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            intersects(circle, polygon) {
                return this.pointInPolygon(circle, polygon)
                    || this.polygonEdges(polygon).some((line) => {
                        return this.pointLineSegmentDistance(circle, line) < circle[2];
                    });
            },
            polygonEdges(polygon) {
                return polygon.map(function (p, i) {
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
            }
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Intersection Logic ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
        },
        watch: {
            jsonData: {
                handler: function (val, oldVal) {
                    // console.log(this.jsonData);
                    this.initTree();
                }
            }
        }
    }
</script>
<style scoped>
    svg {
        background-color: #e8d5bf;
    }
</style>

