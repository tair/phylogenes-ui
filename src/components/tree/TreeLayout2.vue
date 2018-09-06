<template>
    <div>
        <svg id="treeSvg" width="100%" height="900">
            <g id="wrapper" class="wrapper">
                <g class="links">
                    <treelink v-for="link in treelinks" :key="link.id"
                              ref="treelink"
                              :content="link">
                    </treelink>
                </g>
                <!--@contextmenu.prevent="$refs.menu.open($event, {foo: 'bar'})"-->
                <g class="nodes">
                    <treenode v-for="node in treenodes" :id="node.id"
                              ref="treenode"
                              :content="node"
                              v-on:clicknode="onClick"></treenode>
                    <!--<treenode2 v-for="node in treenodes2" :id="node.id"-->
                               <!--ref="treenode"-->
                               <!--:content="node"-->
                               <!--v-on:clicknode="onClick"></treenode2>-->
                </g>

                <!--<dragnode ref="nodeToAdd" :content="exampleNode"-->
                          <!--v-on:dragging="onDrag"-->
                          <!--v-on:dragend="onDragEnd"></dragnode>-->
            </g>
        </svg>
        <context-menu ref="menu">
            <ul class="options" slot-scope="child">
                <li @click="onMenuClick('Add')">Add</li>
                <li @click="onMenuClick('Delete')">Delete</li>
            </ul>
        </context-menu>
        <tree-legend></tree-legend>
    </div>

</template>

<script>
    import * as d3 from 'd3';
    import Vue from 'vue';
    import {mapActions} from 'vuex';

    import * as types from '../../store/types_treedata';
    
    import treenode from '../tree/TreeNode';
    import treenode2 from '../tree/TreeNode2';
    import dragnode from '../tree/DraggableTreeNode';
    import treelink from '../tree/TreeLink';

    import contextMenu from '../menu/ContextMenu';
    import treeLegend from '../tree/Legend';

    export default {
        name: "treelayout2",
        props: ['jsonData'],
        components: {
            'treenode': treenode,
            'treenode2': treenode2,
            'dragnode': dragnode,
            'treelink': treelink,
            'context-menu': contextMenu,
            'tree-legend': treeLegend
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
                    y: 700,
                    xo: 400,
                    yo: 700
                },
                treenodes: [],
                treenodes2: [],
                treelinks: [],
                linkDatums: [],
                rootNode: null,
                oldIndexes: [],
                scale: {x: 1.0, y: 1.0},
                duration: 750,
                duration2: 1,
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
            g.transition().duration(500)
                .attr("transform", (d) => {
                    return "translate(" + 100 + "," + 0 + ")";
                });

            svg.call(this.setZoomListener(g));

            // var nodes = d3.hierarchy(this.treeData, function(d) {
            //     return d.children;
            // });

            if (this.jsonData != null) {
                this.initTree();
            }
        },
        methods: {
            ...mapActions({
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
                stateTreeNodes: types.TREE_ACTION_SET_NODES
            }),
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
            // Reset the tree layout since the nodes have been updated.
            resetTreeLayout() {
                var treeLayout = d3.tree()
                    .size([800, 800]);

                treeLayout(this.rootNode);
            },
            initTree() {
                //  assigns the data to a hierarchy using parent-child relationships
                this.rootNode = d3.hierarchy(this.jsonData, function (d) {
                    return d.children;
                });
                this.updateIdAndText();
                this.updateOldIndexes(this.rootNode.descendants());

                this.resetTreeLayout();

                this.updateTree();
            },
            //TODO: Get this method out of this component
            getText(d) {
                var text = d.id;
                text = "";
                if(!d.data) return null;
                if(d.data.node_type) {
                    if (d.data.node_type === "DUPLICATION") {
                        if (d.data.reference_speciation_event) {
                            text += d.data.reference_speciation_event;
                        } else {
                            text += this.getLeafNodeText(d);
                        }
                    } else if(d.data.node_type === "HORIZONTAL_TRANSFER") {

                    }
                    return text;
                }
                if (d.data.reference_speciation_event) {
                    text += " (" + d.data.reference_speciation_event + ")";
                }
                if(!d.children) {
                    if(d.data.gene_symbol) {
                        text += " " + d.data.gene_symbol;
                    }
                    if(d.data.organism) {
                        text += " -" + d.data.organism;
                    }
                }
                return text;
            },
            getLeafNodeText(d) {
                if(d.children) {
                    // console.log(d.children[0].data);
                    return d.children[0].data.organism;
                }
                return "Leaf Node";
            },
            getNodeColor(d) {
                if(d.data.sf_id) {
                    return "#1b2ad8";
                }
                if(d.data.node_type) {
                    if(d.data.node_type === "DUPLICATION") {
                        return "#f4a460";
                    } else if(d.data.node_type === "HORIZONTAL_TRANSFER") {
                        return "aqua blue";
                    }
                }
                return "#56c356";
            },
            getNodeType(d) {
                if(d.data.sf_id) {
                    return "Diamond";
                }
                if(!d.children) {
                    return "None";
                }
              return "Circle";
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
                        this.stateTreeZoom(d3.event.transform);
                    })
            },
            updateIds() {
                this.index = 0;
                this.rootNode.each(n => {
                    n.id = this.index++;
                });
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
                    var fillColor = this.getNodeColor(n);
                    if(fillColor) {
                        n.fillColor = fillColor;
                    }
                    n.type = this.getNodeType(n);
                });
                this.resetTreeLayout();
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
            updateTree2() {
                //Explain: why old Indexes?
                d3.select('.nodes')
                    .selectAll('g')
                    .data(this.oldIndexes);
                // console.log(this.oldIndexes);

                var nodes = this.rootNode.descendants();
                console.log(nodes);
                this.updateAccordingToDepth(nodes);
                this.saveOldPositions(this.rootNode);
                this.renderLinks(nodes);
                this.renderNodes(nodes);
            },
            updateTree() {
                this.saveOldPositions(this.rootNode);

                //Explain: why old Indexes?
                d3.select('.nodes')
                    .selectAll('g')
                    .data(this.oldIndexes);
                // console.log(this.oldIndexes);

                var nodes = this.rootNode.descendants();
                this.updateAccordingToDepth(nodes);
                this.$emit('updated-tree', nodes);
                // this.saveOldPositions(this.rootNode);
                // console.log(nodes);

                this.renderLinks(nodes);
                this.renderNodes(nodes);
            },
            renderNodes(nodes){
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
                            if (n.constructor && n.constructor.name === "EnterNode") {
                                if (this.clickedNode) {
                                    // console.log("Click ", this.clickedNode.id);
                                    node_content.xo = this.clickedNode.x;
                                    node_content.yo = this.clickedNode.y;
                                }
                            }
                            if (n.__data__.children == null) {
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
                    }, this.duration2);
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
                    }, this.duration2);
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
                this.updateTree();
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
                    this.$refs.nodeToAdd.resetPosition();
                    this.updateIdAndText();
                    this.updateTree2();
                }
            },
            onMenuClick(opt, data) {
                // console.log(this.$refs.menu.userData);
                var nodeId = this.$refs.menu.userData
                if(opt === "Add") {
                    this.addNewChildNode(nodeId);
                    this.updateIdAndText();
                    this.updateTree2();
                }
                if(opt === "Delete") {
                    this.deleteNode(nodeId);
                }
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            deleteNode(nodeId) {
                var nodes = this.rootNode.descendants();
                var nodeToDelete = nodes.find(n => n.id == nodeId);
                if(nodeToDelete) {
                    var parentChildren = nodeToDelete.parent.children;
                    parentChildren = parentChildren.filter(pc => pc.id != nodeId);
                    if(parentChildren.length == 0) parentChildren = null;
                    nodeToDelete.parent.children = parentChildren;
                    // console.log(nodes);
                    this.updateIdAndText();
                    this.updateTree2();
                }
            },
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
            addNewChildNode(nodeId) {
                var nodes = this.rootNode.descendants();
                var parentNode = nodes.find(n => n.id == nodeId);
                if(parentNode) {
                    var nn = {
                        depth: parentNode.depth+1,
                        text: "New Node",
                        parent: parentNode,
                        children: null,
                        x: parentNode.x,
                        y: parentNode.y
                    }
                    if(parentNode.children) {
                        parentNode.children.push(nn);
                    } else {
                        parentNode.children = [];
                        parentNode.children.push(nn);
                    }
                }
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

