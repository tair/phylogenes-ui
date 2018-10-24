<template>
    <div>
        <i v-if="this.isLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
        <svg id="treeSvg" width="100%" height="900">
            <g id="wrapper">
                <g class="links">
                    <baselink v-for="link in treelinks"
                              :key="link.id" ref="treelink"
                              :content="link">
                    </baselink>
                </g>
                <!--@contextmenu.prevent="$refs.menu.open($event, {foo: 'bar'})"-->
                <g class="nodes">
                    <basenode v-for="node in treenodes"
                              :id="node.id" :key="node.id" ref="treenode"
                              :content="node"
                              v-on:clicknode="onClick"></basenode>
                </g>

                <!--<dragnode ref="nodeToAdd" :content="exampleNode"-->
                          <!--v-on:dragging="onDrag"-->
                          <!--v-on:dragend="onDragEnd"></dragnode>-->
            </g>
        </svg>
        <context-menu v-if="enableMenu" ref="menu">
            <ul class="options" slot-scope="child">
                <li @click="onMenuClick('Add')">Add</li>
                <li @click="onMenuClick('Delete')">Delete</li>
            </ul>
        </context-menu>
        <div v-if="showLegend" class="legend-box">
            <tree-legend></tree-legend>
        </div>
    </div>

</template>

<script>
    import * as d3 from 'd3';
    import Vue from 'vue';
    import {mapActions, mapGetters} from 'vuex';

    import * as types from '../../store/types_treedata';

    import baseNode from '../tree/nodes/BaseTreeNode';
    import baseLink from '../tree/links/BaseTreeLink';

    import contextMenu from '../menu/ContextMenu';
    import treeLegend from '../tree/Legend';

    import intersectUtil from "../../util/intersect";

    export default {
        name: "treelayout2",
        props: ['jsonData', 'mappingData'],
        components: {
            'basenode': baseNode,
            'baselink': baseLink,
            'context-menu': contextMenu,
            'tree-legend': treeLegend
        },
        computed: {
            ...mapGetters({
                // stateGetScrollY: types.GET_SCROLL_Y
            })
        },
        watch: {
            jsonData: {
                handler: function (val, oldVal) {
                    // console.log(this.jsonData);
                    this.isLoading = true;
                    this.initTree();
                }
            }
        },
        data() {
            return {
                isLoading: false,
                treenodes: [],
                treelinks: [],
                linkDatums: [],
                rootNode: null,
                oldIndexes: [],
                scale: {x: 1.0, y: 1.0},
                duration: 750,
                duration2: 0.1,
                index: 0,
                counter: 0,
                topPaddingY: 80,
                rowHeight: 40,
                enableMenu: false,
                showLegend: true,
                link_intersected: null,
                wrapper_d3: null
            }
        },
        mounted() {
            this.isLoading = true;
            var svg = d3.select('#treeSvg');
            this.wrapper_d3 = svg.select("#wrapper");
            svg.call(this.setZoomListener(this.wrapper_d3));

            this.resetRootPosition();

            if (this.jsonData != null) {
                // console.log(this.jsonData);
                this.initTree();
            }
        },
        methods: {
            ...mapActions({
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
                stateTreeNodes: types.TREE_ACTION_SET_NODES
            }),
            //Resets the d3 wrapper, empties the links and nodes array,
            // which removes the currently displayed tree and all it's components
            refresh() {
                this.resetRootPosition();
                this.treelinks = [];
                this.treenodes = [];
                // this.$emit('updated-tree', []);
            },
            //Set the d3 svg to it's original position before moving around with mouse
            resetRootPosition() {
                this.wrapper_d3.transition().duration(500)
                    .attr("transform", (d) => {
                        return "translate(" + 80 + "," + 0 + ")";
                    });
            },
            //Initialize Tree at the time of Mounted() or jsonData has been updated.
            initTree() {
                this.refresh();

                //  assigns the data to a hierarchy using parent-child relationships
                this.rootNode = this.convertJsonToD3Hierarchy(this.jsonData);
                var nodes = this.rootNode.descendants();

                //Adds extra variables that describe each node in the tree.
                this.addExtraInfoToNodes();
                this.resetTreeLayout();

                this.updateOldIndexes(nodes);

                setTimeout(() => {
                    this.updateTree();
                    this.isLoading = false;
                }, 1000);
            },
            //Update Tree during every interaction with tree
            // which modifies the tree structure (eg. toggleNode)
            updateTree() {
                this.saveOldPositions(this.rootNode);

                //Explain: why old Indexes?
                d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(this.oldIndexes);
                // console.log(this.oldIndexes);

                var nodes = this.rootNode.descendants();
                this.updateExtraInfo(nodes);
                this.updateAccordingToDepth(nodes);
                this.$emit('updated-tree', nodes);
                // this.saveOldPositions(this.rootNode);
                // console.log(nodes);

                this.renderNodes(nodes);
                this.renderLinks(nodes);
            },
            //Convert json into d3 hierarchy which adds depth, height and
            // parent variables to each node.
            convertJsonToD3Hierarchy(json) {
                return d3.hierarchy(this.jsonData, function (d) {
                    return d.children;
                });
            },

            // ~~~~~~~~~~~~~~~~ Tree Layout Specific ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            // ~~~~~~~~~ Nodes
            renderNodes(nodes){
                var nodesData = d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(nodes, function (d) {
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

                var tempArray = this.getTempArrayForNodes(updatedNodes);
                this.addLinkDatums();

                var timeoutS = 0;
                if (exitingNodes.nodes().length > 0) {
                    timeoutS = this.duration;
                }

                setTimeout(() => {
                    this.treenodes.splice(0, this.treenodes.length);
                    setTimeout(() => {
                        this.treenodes = tempArray;
                        this.updateOldIndexes(nodes);
                    }, this.duration2);
                }, timeoutS);
            },
            getTempArrayForNodes(updatedNodes) {
                var tempArray = [];
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
                    tempArray.push(node_content);

                });

                tempArray.sort((a, b) => {
                    return b.id < a.id;
                });
                return tempArray;
            },
            // Add extra features to nodes of tree
            addExtraInfoToNodes() {
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
            },
            updateExtraInfo(nodes) {
                nodes.forEach(d => {
                    if(d._children) {
                        d.type = "Triangle";
                    } else if(d.type == "Triangle") {
                        d.type = "Circle";
                    }
                });
            },
            //Overwrite each Node positions with custom logic
            setCustomPositionX(d) {
                if (d.depth == 0) {
                    d.x = this.topPaddingY + 0;
                }
                if (d.dfId) {
                    var newX = this.topPaddingY + d.dfId * this.rowHeight;
                    d.x = newX;
                }
            },
            setCustomPositionY(d, tree_depth) {
                // tree_depth required to divide 'y' equally  based on treeWidth and depth of tree.
            },
            setBranchLength(nodes) {
              //If branch length enabled
            },
            // ~~~~~~~~~ Links
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

                var tempArray = this.getTempArrayForLinks(updatedLinks);
                //Explain timeout
                var timeoutS = 0;
                if (exitingLinks.nodes().length > 0) {
                    timeoutS = this.duration;
                }

                setTimeout(() => {
                    this.treelinks.splice(0, this.treelinks.length);
                    setTimeout(() => {
                        //Explain temp array
                        this.treelinks = tempArray;
                    }, this.duration2);
                }, timeoutS);
            },
            getTempArrayForLinks(updatedLinks) {
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
                return tempArray;
            },
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
            // Reset the tree layout since the nodes have been updated.
            resetTreeLayout() {
                var treeLayout = d3.tree()
                    .size([800, 800]);

                treeLayout(this.rootNode);
            },

            // ~~~~~~~~~~~~~~~~ Tree Utilities ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            getLogs(n) {
                if (!n) {
                    console.log("Undefined");
                } else {
                    console.log("Id: " + n.id + " DataId: " + n.data.id);
                }
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

            // ~~~~~~~~~~~~~~~~ Methods for Additional Info for each Node ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            //TODO: Get this methods out of this component
            getText(d) {
                var text = d.id;
                text = "";
                if(!d.data) return null;
                // if(!d._children && d.children) {
                //     return null;
                // }
                if(d.data.node_type) {
                    if (d.data.node_type === "DUPLICATION") {
                        if (d.data.reference_speciation_event) {
                            text += d.data.reference_speciation_event;
                        } else {
                            text += this.getLeafNodeText(d);
                        }
                    } else if(d.data.node_type === "HORIZONTAL_TRANSFER") {
                        if (d.data.reference_speciation_event) {
                            text += d.data.reference_speciation_event;
                        }
                    }
                    return text;
                }
                if (d.data.reference_speciation_event) {
                    text += " (" + d.data.reference_speciation_event + ")";
                }
                if(!d.children) {
                    if(d.data.gene_symbol) {
                        text += " " + d.data.gene_symbol;
                    } else {
                        var geneId = d.data.gene_id;
                        geneId = geneId.split(":")[1];
                        text += " " + geneId;
                    }
                    if(d.data.displayName) {
                        text += " (";
                        text += d.data.displayName;
                        text += ")";
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
                    return "#0000FF";
                }
                if(d.data.node_type) {
                    if(d.data.node_type === "DUPLICATION") {
                        return "#FFA500";
                    } else if(d.data.node_type === "HORIZONTAL_TRANSFER") {
                        return "#00FFFF";
                    }
                }
                return "#00FF00";
            },
            getNodeType(d) {
                if(d.data.sf_id) {
                    return "Diamond";
                }
                if(!d.children) {
                    return "Circle";
                }
                if(d._children) {
                    return "Triangle";
                }
                return "Circle";
            },

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
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
            onClick(source) {
                // console.log(source.id + "-" + source.x + "," + source.y);
                this.clickedNode = {id: source.id, x: source.x, y: source.y};
                this.updateTree();
            },
            onDrag(circle_datum) {
                this.link_intersected = this.linkDatums.find(ld => {
                    if (intersectUtil.intersects(circle_datum, ld.datum)) {
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
            onExpandAll() {
                this.rootNode.each(d => {
                    if(d._children) {
                        d.children = d._children;
                        d._children = null;
                    }
                });
                this.updateTree();
            },

            deleteNode(nodeId) {
                var nodes = this.rootNode.descendants();
                var nodeToDelete = nodes.find(n => n.id == nodeId);
                if(nodeToDelete) {
                    var parentChildren = nodeToDelete.parent.children;
                    parentChildren = parentChildren.filter(pc => pc.id != nodeId);
                    if(parentChildren.length == 0) parentChildren = null;
                    nodeToDelete.parent.children = parentChildren;
                    // console.log(nodes);
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
            // ~~~~~~~~~~~~~~~~ ********************** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateTree2() {
                //Explain: why old Indexes?
                // d3.select('.nodes')
                //     .selectAll('g')
                //     .data(this.oldIndexes);
                // // console.log(this.oldIndexes);
                //
                // var nodes = this.rootNode.descendants();
                // // console.log(nodes);
                // this.updateAccordingToDepth(nodes);
                // this.saveOldPositions(this.rootNode);
                // this.renderLinks(nodes);
                // this.renderNodes(nodes);
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Depth Position Logic ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateAccordingToDepth(nodes, flag) {
                this.counter = 0;
                this.calculateDepthFirstIds(nodes[0]);
                //Arrange nodes position by depth ids.
                nodes.forEach(d => {
                    this.setCustomPositionX(d);
                });
            },
        }
    }
</script>
<style scoped>
    svg {
        background-color: #e8d5bf;
    }
    .legend-box {
        position: absolute;
        top: 85px;
        right: 15px;
        width: 20%;
        float: left;
    }
</style>

