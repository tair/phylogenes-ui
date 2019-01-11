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
        props: ['jsonData', 'mappingData', 'matchedNodes'],
        components: {
            'basenode': baseNode,
            'baselink': baseLink,
            'context-menu': contextMenu,
            'tree-legend': treeLegend
        },
        computed: {
            ...mapGetters({
                store_matchedNodes: types.TREE_GET_MATCHED_NODES,
                stateTableScroll: types.TABLE_GET_SCROLL
            })
        },
        watch: {
            jsonData: {
                handler: function (val, oldVal) {
                    // console.log(this.jsonData);
                    this.isLoading = true;
                    this.initTree();
                }
            },
            store_matchedNodes: {
                handler: function (val, oldVal) {
                    this.processMatchedNodes(val);
                }
            },
            stateTableScroll: {
                handler: function (val, oldVal) {
                    var nodes = this.rootNode.descendants();
                    var treeNode = nodes.find(n => n.geneId == val.id);

                    this.moveTreeToNodePosition(treeNode);
                }
            }
        },
        data() {
            return {
                isLoading: false,
                layoutType: "Cluster", //"TopDown"
                treenodes: [],
                treelinks: [],
                leafNodesByDepth: [],
                rowsScrolledUp: 0,
                linkDatums: [],
                rootNode: null,
                oldIndexes: [],
                scale: {x: 1.0, y: 1.0},
                currentPan: {x: 0.0, y:0.0},
                duration: 750,
                duration2: 0.1,
                index: 0,
                counter: 0,
                topPaddingY: 80,
                rowHeight: 40,
                enableMenu: false,
                showLegend: true,
                showBranchLength: true,
                link_intersected: null,
                wrapper_d3: null,
                topMostNodePos: {x: 0.0, y: 0.0},
                currentTopNodePos: {x: 0.0, y: 0.0},
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
                store_setCenterNode: types.TREE_ACTION_SET_CENTER_NODE,
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
                //Update nodes dfid according to depth of nodes.
                this.calculateDepthIds(nodes);

                setTimeout(() => {
                    this.updateTree();
                    this.adjustPosition(nodes);
                    this.isLoading = false;
                }, 1000);
            },
            updateTreeOnlyRendering() {
                //Explain: why old Indexes?
                // Needed as renderNodes will throw 'id not defined' error without this step.
                d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(this.oldIndexes);

                var nodes = this.rootNode.descendants();
                this.updateExtraInfo(nodes);

                this.renderNodes(nodes, false);
                this.renderLinks(nodes);
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

                this.resetTreeLayout();

                // this.updateAccordingToDepth(nodes);
                this.$emit('updated-tree', nodes);
                // console.log(nodes);

                this.renderNodes(nodes, true);
                this.renderLinks(nodes);

                this.setLeafNodesByDepth(nodes);
            },
            //Convert json into d3 hierarchy which adds depth, height and
            // parent variables to each node.
            convertJsonToD3Hierarchy(json) {
                return d3.hierarchy(this.jsonData, function (d) {
                    return d.children;
                });
            },
            processMatchedNodes(matNodes) {
                if(!this.rootNode) return;

                let firstMatchedNode = null; //Used for centering the tree panel to this matched node
                let allNodes = this.rootNode.descendants();
                let foundAnyInHidden = false;

                allNodes.forEach(d => {
                    d.matched = false; //Init all matched flags to false
                    var geneId = d.data.gene_id;
                    if (geneId) {
                        geneId = geneId.split(':')[1];
                    }

                    matNodes.forEach(v => {
                        if(geneId === v["Gene ID"]) {
                            d.matched = true;
                        }
                    });

                    if(matNodes.length > 0 && geneId === matNodes[0]["Gene ID"]) {
                        if(firstMatchedNode == null) {
                            firstMatchedNode = d;
                        }
                    }

                    if(d._children) {
                        let tempFound = this.findMatNodesInChildren(d, matNodes, firstMatchedNode);
                        if(!foundAnyInHidden && tempFound) {
                            foundAnyInHidden = true;
                            this.expandAllFromNode(d);
                        }
                    }
                });

                //Center Tree panel to first matched node
                this.centerTreeToGivenNode(firstMatchedNode);
                this.updateTree();

                if(foundAnyInHidden && firstMatchedNode == null) {
                    setTimeout(() => {
                        allNodes = this.rootNode.descendants();
                        allNodes.forEach(d => {
                            var geneId = d.data.gene_id;
                            if (geneId) {
                                geneId = geneId.split(':')[1];
                            }
                            if(matNodes.length > 0 && geneId === matNodes[0]["Gene ID"]) {
                                this.centerTreeToGivenNode(d);
                                this.alignNodes();
                            }
                        });
                    }, 1000);
                }
            },
            findMatNodesInChildren(d, matNodes) {
                var foundAny = false;
                if(d.children) {
                    d.children.forEach(dc => {
                        var found = matNodes.find(v => v["Gene ID"] === dc.geneId);
                        if(found) {
                            dc.matched = true;
                            foundAny = true;
                        }
                        var ff = this.findMatNodesInChildren(dc, matNodes);
                        if(ff) {
                            foundAny = true;
                        }
                    });
                }
                if(d._children) {
                    d._children.forEach(dc => {
                        var found = matNodes.find(v => v["Gene ID"] === dc.geneId);
                        if(found) {
                            dc.matched = true;
                            foundAny = true;
                        }
                        var ff = this.findMatNodesInChildren(dc, matNodes);
                        if(ff) {
                            foundAny = true;
                        }
                    });
                }
                return foundAny;
            },

            // ~~~~~~~~~~~~~~~~ Tree Layout Specific ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            // ~~~~~~~~~ Nodes
            renderNodes(nodes, updatePos){
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
                        this.alignNodes();
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
            // Use this function during init
            addExtraInfoToNodes() {
                this.index = 0;
                this.rootNode.each(n => {
                    n.id = this.index++;
                    // console.log(n.id + " X: " + n.x);

                    //Check if the node data contains a text we can use
                    if(n.data.text) {
                        n.text = n.data.text;
                    }
                    if(n.data.fillColor) {
                        n.fillColor = n.data.fillColor;
                    }
                    n.type = this.getNodeType(n);
                    n.geneId = this.getGeneId(n);
                    if(!n.children) {
                        n.hideShape = true;
                    } else {
                        n.hideShape = false;
                    }
                });
            },
            // Updates extra features
            // Use this function during update
            updateExtraInfo(nodes) {
                nodes.forEach(d => {
                    this.updateNodeType(d);
                    this.updateNodeText(d);
                });
            },
            updateNodeType(d) {
                if(d._children) {
                    d.type = "Triangle";
                } else if(d.type == "Triangle") {
                    if(d.data.sf_id) {
                        d.type = "Diamond";
                    } else {
                        d.type = "Circle";
                    }
                }
            },
            updateNodeText(d) {
                if(!d._children && d.children) {
                    d.hideText = true;
                } else {
                    d.hideText = false;
                }
                if(d._children) {
                    var geneCount = this.getChildrenCount(d);
                    var collapsedText = geneCount + " Genes ";
                    collapsedText += "(" + d.text + ")";
                    d.updatedText = collapsedText;
                }
                if(d.matched) {
                    d.textColor = "red";
                } else {
                    d.textColor = "black";
                }
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
                var treeWidth = 800;
                var defaultLength = treeWidth/tree_depth;
                var branchScale = this.showBranchLength ? d.data.branch_length: 0.5;
                var actualLength = defaultLength * branchScale;

                // var text = d.text + " BS - " + branchScale;
                // d.text = text;
                if(actualLength < 20) actualLength = 10;
                if(d.parent) {
                    d.y = d.parent.y;
                    d.y = d.y + actualLength;
                }
            },
            //Set link length (y) based on given scale
            setBranchLength(nodes) {
                var totalDepth = this.getTotalDepthofTree(nodes);
                nodes.forEach(d => {
                    this.setCustomPositionY(d, totalDepth);
                });
            },
            //Set position to top-most node during init
            adjustPosition(nodes) {
                var topNode = this.getTopmostNode(nodes);
                this.setTopmostNodePos(topNode);
                this.moveTreeToNodePosition(topNode);
                this.setCurrentTopNode({x: this.topMostNodePos.x, y: this.topMostNodePos.y});
                this.stateTreeZoom({x:0, y:0});
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
                if(this.layoutType == "Cluster") {
                    treeLayout = d3.cluster()
                        .nodeSize([40,30])
                        .separation((a, b) => {
                            return (a.parent == b.parent ? 1 : 1) }
                        );
                }
                treeLayout(this.rootNode);

                var nodes = this.rootNode.descendants();
                this.setBranchLength(nodes);
            },

            // ~~~~~~~~~~~~~~~~ Tree Utilities ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            getTotalDepthofTree(nodes) {
                var totalDepth = 1;
                //Calculate depth of tree
                nodes.forEach(d => {
                    if(d.depth > totalDepth) {
                        totalDepth = d.depth;
                    }
                });
                return totalDepth;
            },
            getTopmostNode(nodes) {
                var nodesOrderedByDepth = nodes.sort((a, b) => a.dfId - b.dfId);

                var topMostNode = null;
                nodesOrderedByDepth.some(d => {
                    // console.log(d.id + " - " + d.dfId + " - " + d.x);
                    topMostNode = d;
                    return !d.children;
                });
                return topMostNode;
            },
            setTopmostNodePos(node) {
                var paddingTop = 50;
                this.topMostNodePos.y = -1 * node.x + paddingTop;
                this.topMostNodePos.x = 80;
            },
            //Get total number of children for a node
            getChildrenCount(node) {
                var count = 0;
                if(!node.children && !node._children) {
                    count ++;
                }
                //Since the child node might be collapsed, we need to get cached children count too
                if(node._children) {
                    node._children.forEach(cn => {
                        count += this.getChildrenCount(cn);
                    });
                }
                if(node.children) {
                    node.children.forEach(cn => {
                        count += this.getChildrenCount(cn);
                    });
                }

                return count;
            },
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
            calculateDepthIds(nodes) {
                this.counter = 0;
                //Recursive method
                this.calculateDepthFirstIds(nodes[0]);
            },
            centerTreeToGivenNode(node) {
                if(node == null) {
                    this.store_setCenterNode(node);
                    return;
                }
                let leafNodes = this.getLeafNodesByDepth();
                let foundNodeIdx = leafNodes.findIndex(n => n.id === node.id);
                this.rowsScrolledUp = foundNodeIdx-8;
            },
            moveTreeToNodePosition(node) {
                let leafNodes = this.getLeafNodesByDepth();
                let foundNodeIdx = leafNodes.findIndex(n => n.id === node.id);
                this.rowsScrolledUp = foundNodeIdx;
                this.alignNodes();
            },
            moveTreeWithPadding(node, padding) {
                //If the top node is within the screen range,
                // padding should be 0, so that the tree doesn't move out of the screen
                if(node.x <= 0 && node.x >= -100) padding = 0;
                let paddingTop = 50 + padding;
                let nodePos = -1*node.x + paddingTop;
                this.wrapper_d3
                    .attr("transform", (d) => {
                        return "translate(" + 80 + "," + nodePos + ")";
                    });
            },

            // ~~~~~~~~~~~~~~~~ Methods for Additional Info for each Node ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
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
            getGeneId(d) {
                var geneId = d.data.gene_id;
                if (geneId) {
                    geneId = geneId.split(':')[1];
                } else {
                    geneId = null;
                }
                return geneId;
            },

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            setZoomListener(g) {
                let startTransform = {x:0, y:0};
                return d3.zoom().scaleExtent([this.scale.x, this.scale.y])
                    .on("start", () => {
                        startTransform = d3.event.transform;
                    })
                    .on("zoom", () => {
                        this.onPan(g, startTransform);
                    })
                    .on("end", () => {
                        this.onPanEnd(startTransform);
                    })
            },
            onClick(source) {
                // console.log(source.id + "-" + source.x + "," + source.y);
                this.clickedNode = {id: source.id, x: source.x, y: source.y};
                this.updateTree();
            },
            onPan(g, transform) {
                var diff = d3.event.transform.y - transform.y;
                let translateX = this.currentTopNodePos.x + (d3.event.transform.x - transform.x);
                var translateY = this.currentTopNodePos.y + diff;
                g.attr("transform", (d) => {
                    return "translate(" + translateX + "," + translateY + ")";
                });
            },
            onPanEnd(transform) {
                var diffEnd = d3.event.transform.y - transform.y;
                if(diffEnd < 0) {
                    let rowNum = Math.round(diffEnd/40*-1);
                    this.rowsScrolledUp += rowNum;
                } else {
                    let rowNum = Math.round(diffEnd/40);
                    this.rowsScrolledUp -= rowNum;
                }

                this.currentTopNodePos.x += d3.event.transform.x - transform.x;
                this.alignNodes();
            },
            alignNodes() {
                let leafNodes = this.getLeafNodesByDepth();
                if(this.rowsScrolledUp <= 0) this.rowsScrolledUp=0;

                var currTopNode = leafNodes[this.rowsScrolledUp];
                // console.log(currTopNode);
                var topNodePosY = -1*currTopNode.x + 40;
                var topNodePosX = this.currentTopNodePos.x;

                this.wrapper_d3.transition().duration(500)
                    .attr("transform", (d) => {
                        this.setCurrentTopNode({x: topNodePosX, y: topNodePosY});
                        return "translate(" + topNodePosX + "," +  topNodePosY+ ")";
                    });
                let currCenterNode = leafNodes[this.rowsScrolledUp + 8];
                this.store_setCenterNode(currCenterNode);
            },
            getLeafNodesByDepth() {
                return this.leafNodesByDepth;
            },
            setLeafNodesByDepth(nodes) {
                this.leafNodesByDepth = nodes.sort((a, b) => a.dfId - b.dfId)
                    .filter(n => !n.children);
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
            expandAllFromNode(givenNode) {
                if(givenNode._children) {
                    givenNode.children = givenNode._children;
                    givenNode._children = null;
                }
                if(givenNode.children) {
                    givenNode.children.forEach(n => {
                        this.expandAllFromNode(n);
                    });
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
            onShowLegend() {
                this.showLegend = !this.showLegend;
            },

            //Node Events
            setCurrentTopNode(pos) {
                this.currentTopNodePos = pos;
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
        background-color: white;
    }
    .legend-box {
        background-color: #9E9E9E;
        position: absolute;
        top: 85px;
        right: 5px;
        width: 230px;
        float: left;
    }
</style>

