<template>
    <span class="_parent">
        <i v-if="this.isLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
        <svg id="treeSvg" ref="treesvg" width="100%" height="100%">
            <g id="wrapper">
                <g class="links">
                    <baselink v-for="link in treelinks_view"
                                :key="link.id" ref="treelink"
                                :content="link">
                    </baselink>
                </g>
                <g class="nodes">
                    <basenode v-for="node in treenodes_view"
                                :id="node.id" :key="node.id" ref="treenode"
                                :content="node"
                                v-on:clicknode="onClick"></basenode>
                </g>
            </g>
        </svg>
        <div v-if="showLegend" class="legend-box">
            <tree-legend></tree-legend>
        </div>
    </span>
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
        name: "treelayout",
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
                stateTableScroll: types.TABLE_GET_SCROLL,
                stateTreeData: types.TREE_GET_DATA
            })
        },
        watch: {
            jsonData: {
                deep: true,
                handler: function (val, oldVal) {
                    this.isLoading = true;
                    if(val != null) {
                        this.initTree();
                    }
                }
            },
            store_matchedNodes: {
                handler: function (val, oldVal) {
                    if(!this.isLoading) {
                        this.processMatchedNodes(val);
                    }
                }
            },
            stateTreeData: {
                handler: function (val, oldVal) {
                    if(val.length == 0) {
                        this.isLoading = true;
                        this.refreshView();
                    }
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
                isLazyLoad: true,
                isAnimated: false,
                //constants
                rowLimit_lazyLoad: 25,
                //Layout
                layoutType: "Cluster", //"TopDown",
                treeLayoutObj: null,
                scale: {x: 1.0, y: 1.0},
                treenodes_view: [],
                origTreenodes: [],
                treelinks_view: [],
                origTreelinks: [],
                leafNodesByDepth: [],
                rowsScrolledUp: 0,
                linkDatums: [],
                rootNode: null,
                oldIndexes: [],
                currentPan: {x: 0.0, y:0.0},
                duration: 750,
                duration2: 0.1,
                index: 0,
                counter: 0,
                rowHeight: 41,
                enableMenu: false,
                showLegend: false,
                showBranchLength: true,
                link_intersected: null,
                wrapper_d3: null,
                topMostNodePos: {x: 0.0, y: 0.0},
                currentTopNodePos: {x: 0.0, y: 0.0}
            }
        },
        mounted() {
            if(this.jsonData) {
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
            refreshView() {
                this.resetRootPosition();
                this.treelinks_view = [];
                this.treenodes_view = [];
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
                if(this.jsonData == null) {
                    console.error("jsonData is null!");
                    return;
                }
                var svg = d3.select('#treeSvg');
                this.wrapper_d3 = svg.select("#wrapper");
                svg.call(this.setZoomListener(this.wrapper_d3));
                this.refreshView();

                 // ~~~~~~~~~~~~~~~ Init tree nodes but not render them yet. ~~~~~~~~~~~~~~//
                //  assigns the data to a hierarchy using parent-child relationships
                this.rootNode = this.convertJsonToD3Hierarchy(this.jsonData);
                var nodes = this.rootNode.descendants();
                //Adds extra variables that describe each node in the tree.
                this.addExtraInfoToNodes();

                this.initTreeLayout(this.rootNode);
                
                this.updateOldIndexes(nodes);
                //Update nodes dfid according to depth of nodes.
                this.calculateDepthIds(nodes);
                this.$emit('init-tree', nodes);
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

                this.adjustTreeLayoutPosition(); 
                this.updateTree();
            },
            //Convert json into d3 hierarchy which adds depth, height and
            // parent variables to each node.
            convertJsonToD3Hierarchy(json) {
                return d3.hierarchy(this.jsonData, function (d) {
                    return d.children;
                });
            },
            // ~~~~~~~~~~~~~~~ TREE LAYOUT ~~~~~~~~~~~~~~~ //
            /** 
             * root: ƒ Node(data) {
                    this.data = data;
                    this.depth =
                    this.height = 0;
                    this.parent = null;
                }
            */
            initTreeLayout(root) {
                this.treeLayoutd3Obj = d3.tree()
                    .size([800, 800]);
                if(this.layoutType == "Cluster") {
                    this.treeLayoutd3Obj = d3.cluster()
                        .nodeSize([40,30])
                        .separation((a, b) => {
                            return (a.parent == b.parent ? 1 : 1) }
                        );
                }
                this.treeLayoutd3Obj(root);
            },
            // Reset the tree layout since the nodes have been updated.
            resetTreeLayout() {
                this.treeLayoutd3Obj(this.rootNode);

                var nodes = this.rootNode.descendants();
                this.setBranchLength(nodes);
            },
            //Init. Find out the top most node in the tree and align tree layout to that node.
            adjustTreeLayoutPosition() {
                let nodes = this.rootNode.descendants();
                let topNode = this.getTopmostNode(nodes);
                this.setTopmostNodePos(topNode);
                this.moveTreeToNodePosition(topNode);
                this.setCurrentTopNode({x: this.topMostNodePos.x, y: this.topMostNodePos.y});
                this.stateTreeZoom({x:0, y:0});
            },
            //Update Tree during every interaction with tree
            // which modifies the tree structure (eg. toggleNode)
            updateTree() {
                this.saveOldPositions(this.rootNode);

                var modifiedNodes = this.rootNode.descendants();
                this.updateExtraInfo(modifiedNodes);

                this.resetTreeLayout();
                this.$emit('updated-tree', modifiedNodes);

                this.renderNodes(modifiedNodes);
                this.renderLinks(modifiedNodes);

                this.setLeafNodesByDepth(modifiedNodes);
            },
            // ~~~~~~~~~ Nodes
            renderNodes(nodes){
                //d3 needs the current nodes to have some data associated with it, 
                // so that when we update the nodes, it can generate proper "Enter", "Exit" and
                // "Updated" nodes based on change in the data.
                // The data we associate is the array of tree nodes "treenodes[]"
                // The treenodes array is still the old array, which is updated using d3 later.
                d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(this.oldIndexes);
                // console.log("Modified Nodes ", nodes.length);
                // console.log("Old Nodes ", this.oldIndexes.length);
                //modifiedNodes tells d3 which nodes have been modified compared to previously rendered
                // 'treenodes'.
                var nodesData = d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(nodes, function (d) {
                        return d.id;
                    });

                //enteringNodes gives any new nodes added to the tree (expand)
                //type: EnterNode. EnterNode.nodes() gives array of nodes.
                //(more nodes than treenodes array, which means new nodes need to be rendered)
                const enteringNodes = nodesData.enter();

                //exitingNodes gives any nodes removed from the tree (collapse)
                //(less nodes than original treenodes array, which means some nodes are removed)
                const exitingNodes = nodesData.exit();
                let waitForExitNodesToBeRemoved = false;
                if(this.isAnimated) {
                    if (exitingNodes.nodes().length > 0) {
                        waitForExitNodesToBeRemoved = true;
                        exitingNodes.nodes().forEach(n => {
                            if (n.__data__) {
                                var findNode = this.$refs.treenode.find(en => en.content.id == n.__data__.id);
                                if(findNode) {
                                    findNode.onExit(this.clickedNode);
                                }
                            }
                        });
                    }
                }
                
                const updatedNodes = enteringNodes.merge(nodesData);
                this.origTreenodes = this.getModifiedUpdatedNodes(updatedNodes);
                let lazyTreenodes = this.origTreenodes;
                if(this.isLazyLoad) {
                    lazyTreenodes = this.sliceArrayForView(this.origTreenodes);
                    lazyTreenodes.forEach(n => {
                        n.xo = n.x;
                        n.yo = n.y;
                    });
                }
                if(waitForExitNodesToBeRemoved) {
                    setTimeout(() => {
                        this.setTreeNodes(lazyTreenodes, this.origTreenodes);
                    }, 750);
                } else {
                    this.setTreeNodes(lazyTreenodes, this.origTreenodes);
                }
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
                let waitForExitNodesToBeRemoved = false;
                if(this.isAnimated) {
                    if (exitingLinks.nodes().length > 0) {
                        waitForExitNodesToBeRemoved = true;
                        exitingLinks.nodes().forEach(n => {
                            if (n.__data__) {
                                let findLink = this.$refs.treelink.find(en => en.content.id == n.__data__.id);
                                if(findLink) {
                                    findLink.onExit(this.clickedNode);
                                }
                            }
                        });
                    }
                }

                this.origTreelinks = this.getModifiedUpdatedLinks(updatedLinks);              
                let lazyTreelinks = this.origTreelinks;
                if(this.isLazyLoad) {
                    lazyTreelinks = this.sliceLinksArrayForView(this.origTreelinks);
                }
                if(waitForExitNodesToBeRemoved) {
                    setTimeout(() => {
                        this.setTreeLinks(lazyTreelinks);
                    }, 750);
                } else {
                    this.setTreeLinks(lazyTreelinks);
                }
            },
            //Add node content from d3 updatedNodes to an array sorted by n.id and customized
            getModifiedUpdatedNodes(updatedNodes) {
                var tempArray = [];
                updatedNodes.nodes().forEach(n => {
                    var node_content = n.__data__;
                    if(this.isAnimated) {
                        if (n.constructor && n.constructor.name === "EnterNode") {
                            if (this.clickedNode) {
                                node_content.xo = this.clickedNode.x;
                                node_content.yo = this.clickedNode.y;
                            }
                        }
                    } else {
                        node_content.xo = node_content.x;
                        node_content.yo = node_content.y;
                    }
                    
                    tempArray.push(node_content);

                });

                tempArray.sort((a, b) => {
                    return b.id < a.id;
                });
                return tempArray;
            },
            getModifiedUpdatedLinks(updatedLinks) {
                var tempArray = [];
                updatedLinks.nodes().forEach(n => {
                    var node_content = n.__data__;
                    node_content.enterLink = false;
                    if(this.isAnimated) {
                        if (n.constructor && n.constructor.name === "EnterNode") {
                            node_content.enterLink = true;
                        }
                    }
                    tempArray.push(node_content);
                });

                tempArray.sort((a, b) => {
                    return b.id < a.id;
                });
                return tempArray;
            },
            //Due to javascript and vue, we cannot set a v-for like 'treenodes' directly
            // like this.treenodes_view = temparray. This assignment won't update the view.
            // so additional steps like splice (which empties the array) and a timeout is required
            // which notifies Vue that the array has been updated, and rerenders the array components.
            setTreeNodes(nodesArr1, nodesArr2) {
                this.treenodes_view.splice(0, this.treenodes_view.length);
                setTimeout(() => {
                    this.treenodes_view = nodesArr1;
                    this.updateOldIndexes(nodesArr2);
                    this.alignTree();
                });
            },
            setTreeLinks(linksArr) {
                this.treelinks_view.splice(0, this.treelinks_view.length);
                setTimeout(() => {
                    this.treelinks_view = linksArr;
                    this.isLoading = false;
                });
            },
            // Align tree layout according to the rows moved up
            // Setting top node padding goes here.
            alignTree() {
                if(this.wrapper_d3 == null) return;

                let leafNodes = this.getLeafNodesByDepth();

                if(this.rowsScrolledUp <= 0) this.rowsScrolledUp=0;
                let svgHeight = this.getTreePanelHeight();
                let rowHeight = 40;
                let totalRowsInPanel = Math.floor(svgHeight/rowHeight);
                let maxRowsMovedUp = leafNodes.length - (totalRowsInPanel-1);
                if(maxRowsMovedUp < 0) maxRowsMovedUp = 0;

                if(this.rowsScrolledUp >= maxRowsMovedUp) this.rowsScrolledUp = maxRowsMovedUp;

                var currTopNode = leafNodes[this.rowsScrolledUp];
                if(!currTopNode) return;

                let topPadding = rowHeight+25;
                var topNodePosY = -1*currTopNode.x + topPadding;
                var topNodePosX = this.currentTopNodePos.x;

                this.wrapper_d3.transition().duration(500)
                    .attr("transform", (d) => {
                        this.setCurrentTopNode({x: topNodePosX, y: topNodePosY});
                        return "translate(" + topNodePosX + "," +  topNodePosY+ ")";
                    });
                let currCenterNode = leafNodes[this.rowsScrolledUp + 8];
                this.store_setCenterNode(currCenterNode);
            },
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Lazy load nodes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateViewOnly() {
                if(!this.isLazyLoad) return;
                this.treenodes_view.splice(0, this.treenodes_view.length);
                this.treelinks_view.splice(0, this.treelinks_view.length);
                let lazyTreenodes = this.origTreenodes;
                let lazyTreelinks = this.origTreelinks;
                setTimeout(() => {
                    lazyTreenodes = this.sliceArrayForView(this.origTreenodes);
                //     lazyTreenodes = this.modifyForPan(lazyTreenodes);
                    lazyTreelinks = this.sliceLinksArrayForView(this.origTreelinks);
                //     // lazyTreelinks.forEach(n => {
                //     //     if(n.enterLink) {
                //     //         console.log(n);
                //     //     }
                //     // });
                    this.treenodes_view = lazyTreenodes;
                    this.treelinks_view = lazyTreelinks;
                });
            },
            sliceArrayForView(arr) {
                arr.sort((a, b) => {
                    if(a.x < b.x) {
                        return -1;
                    }
                    if(a.x > b.x) {
                        return 1;
                    }
                    return 0;
                });
                let splitArr = [];
                // let origArr = [];
                let rowCount = 0;
                let rowLimit = this.rowLimit_lazyLoad;
                if(this.rowsScrolledUp > 0) {
                    rowLimit += this.rowsScrolledUp;
                }
                arr.some(n => {
                    if(!n.children) {
                        rowCount++;
                    }
                    if(rowCount > this.rowsScrolledUp - 2) {
                        splitArr.push(n);
                    }
                    // origArr.push(n);
                    return rowCount > rowLimit;
                });
                // console.log(origArr.length, ",", splitArr.length);
                return splitArr;
            },
            sliceLinksArrayForView(arr) {
                
                arr.sort((a, b) => {
                    if(a.x < b.x) {
                        return -1;
                    }
                    if(a.x > b.x) {
                        return 1;
                    }
                    return 0;
                });
                let splitArr = [];
                // let origArr = [];
                let rowCount = 0;
                let rowLimit = this.rowLimit_lazyLoad;
                if(this.rowsScrolledUp > 0) {
                    rowLimit += this.rowsScrolledUp;
                }
                arr.some(n => {
                    if(!n.children) {
                        rowCount++;
                    }
                    // if(rowCount > this.rowsScrolledUp - 2) {
                    //     splitArr.push(n);
                    // }
                    // origArr.push(n);
                    splitArr.push(n);
                    return rowCount > rowLimit+50;
                });
                // console.log(origArr.length, ",", splitArr.length);
                return splitArr;
            },
            modifyForPan(nodes) {
                console.log("modifyForPan");
                nodes.forEach(n => {
                    n.xo = n.x;
                    n.yo = n.y;
                    n.enterLink = false;
                    n.justPan = true;
                });
                return nodes;
            },

            // ~~~~~~~~~~~~~~~~ Search Within Matched Node Specific ~~~~~~~~~~~~~~~~~//
            processMatchedNodes(matchedNodes) {
                if(matchedNodes.length == 0) {
                    this.resetMatchedNodes();
                    return;
                }
                let allNodes = this.rootNode.descendants();
                allNodes.forEach(d => {
                    d.matched = false;
                    if(!d.children) {
                        let found = this.isMatchWithNode(d, matchedNodes);
                        if(found) {
                            d.matched = true;
                        }
                    }
                    if(d._children) {
                        if(this.findMatNodesInChildren(d, matchedNodes)) {
                            this.expandAllFromNode(d);
                        }
                    }
                });

                let firstMatchedNode = this.findFirstMatchedNodeInTree();
                setTimeout(() => {
                    this.centerTreeToGivenNode(firstMatchedNode);
                }, 1000);
                this.updateTree();
            },
            findFirstMatchedNodeInTree() {
                var nodes = this.rootNode.descendants();
                nodes = nodes.filter(n => {return !n.children});
                let sortedNodes = nodes.sort(function (a, b) {
                    return a.dfId - b.dfId;
                });
                let firstNode = sortedNodes.find(n => {return n.matched});
                return firstNode;
            },
            resetMatchedNodes() {
                if(!this.rootNode) return;

                let allNodes = this.rootNode.descendants();
                allNodes.forEach(d => {
                    d.matched = false;
                });
                this.updateTree();
            },
            findMatNodesInChildren(d, matNodes) {
                var foundAny = false;
                if(d.children) {
                    d.children.forEach(dc => {
                        let found = this.isMatchWithNode(dc, matNodes);
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
                        let found = this.isMatchWithNode(dc, matNodes);
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
            isMatchWithNode(d, matNodes) {
                return matNodes.find(v => v["Uniprot ID"] === d.data.uniprotId);
            },
            // ~~~~~~~~~~~~~~~~ *** ~~~~~~~~~~~~~~~~~//
            
            // ~~~~~~~~~~~~~~~~ Tree Layout Specific ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            // Add extra features to nodes of tree
            // Use this function during init
            addExtraInfoToNodes() {
                this.index = 0;
                this.rootNode.each(n => {
                    n.id = this.index++;

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

            },
            setCustomPositionY(d, tree_depth) {
                // tree_depth required to divide 'y' equally  based on treeWidth and depth of tree.
                var treeWidth = 800;
                var defaultLength = treeWidth/tree_depth;
                var branchScale = this.showBranchLength ? d.data.branch_length: 0.5;
                var actualLength = defaultLength * branchScale;

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

            // ~~~~~~~~~~~~~~~~ Tree Utils ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
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
                if(diffEnd != 0 && this.isLazyLoad) {
                    this.updateViewOnly();
                }
                if(diffEnd < 0) {
                    let rowNum = Math.round(diffEnd/40*-1);
                    this.rowsScrolledUp += rowNum;
                } else {
                    let rowNum = Math.round(diffEnd/40);
                    this.rowsScrolledUp -= rowNum;
                }
                this.currentTopNodePos.x += d3.event.transform.x - transform.x;
                this.alignTree();
            },
            moveUp() {
                this.rowsScrolledUp=this.rowsScrolledUp+5;
                this.alignTree();
            },
            centerTreeToGivenNode(node) {
                if(node == null) {
                    this.store_setCenterNode(node);
                    return;
                }
                let leafNodes = this.getLeafNodesByDepth();
                let foundNodeIdx = leafNodes.findIndex(n => n.id === node.id);
                this.rowsScrolledUp = foundNodeIdx-8;
                this.alignTree();
            },
            moveTreeToNodePosition(node) {
                let leafNodes = this.getLeafNodesByDepth();
                let foundNodeIdx = leafNodes.findIndex(n => n.id === node.id);
                this.rowsScrolledUp = foundNodeIdx;
                this.alignTree();
            },
            getTreePanelHeight() {
                if(this.$refs.treesvg) {
                    return this.$refs.treesvg.clientHeight;
                } else {
                    return 0;
                }
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
                    this.$refs.nodeToAdd.onIntersect(true);
                } else {
                    this.$refs.nodeToAdd.onIntersect(false);
                }
            },
            onDragEnd() {
                if (this.link_intersected) {
                    const nn = this.addNewNodeBetweenLink(this.link_intersected);
                    this.$refs.nodeToAdd.resetPosition();
                }
            },
            onMenuClick(opt, data) {
                var nodeId = this.$refs.menu.userData
                if(opt === "Add") {
                    this.addNewChildNode(nodeId);
                    this.updateIdAndText();
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
        }
    }
</script>
<style scoped>
    ._parent {
        width: inherit;
        height: inherit;
    }
    svg {
        background-color: white;
        /*cursor: grab;*/
    }
    .legend-box {
        background-color: #9E9E9E;
        position: absolute;
        top: 1px;
        right: 5px;
        width: 230px;
        float: left;
    }
    
</style>

