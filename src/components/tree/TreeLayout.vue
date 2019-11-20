<template>
    <span class="_parent">
        <!-- <i v-if="this.isLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i> -->
        <div class="menu">
            <div v-if="showLegend" class="legend-box">
                <tree-legend></tree-legend>
            </div>
        </div>
        <svg id="treeSvg" ref="treesvg" width="100%" :height="svgHeight">
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
 
    </span>
</template>

<script>
    import * as d3 from 'd3';
    import Vue from 'vue';
    import {mapActions, mapGetters} from 'vuex';

    import * as types from '../../store/types_treedata';
    import * as types_tree from '../../store/types_tree';

    import baseNode from '../tree/nodes/BaseTreeNode';
    import baseLink from '../tree/links/BaseTreeLink';

    import contextMenu from '../menu/ContextMenu';
    import treeLegend from '../tree/Legend';

    import nodesUtils from './utils/matchedNote';
    import exportUtils from './utils/exportSvg';
    import intersectUtil from "../../util/intersect";
    import commonTreeUtils from './utils/commonTreeUtils';
    import updateDisplayUtils from './utils/updateDisplayUtils';

    export default {
        name: "treelayout",
        props: ['jsonData', 'mappingData', 'matchedNodes', 'heightFP'],
        components: {
            'basenode': baseNode,
            'baselink': baseLink,
            'context-menu': contextMenu,
            'tree-legend': treeLegend
        },
        computed: {
            ...mapGetters({
                store_matchedNodes: types.TREE_GET_MATCHED_NODES,
                store_getTableScrollRow: types.TABLE_GET_SCROLL,
                store_tableData: types.TABLE_GET_DATA,
                store_tableIsLoading: types.TABLE_GET_ISTABLELOADING,
                store_annoMapping: types.TREE_GET_ANNO_MAPPING,
                store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
                store_getHasGrafted: types.TREE_GET_ISGRAFTED
            })
        },
        watch: {
            jsonData: {
                deep: true,
                handler: function (val, oldVal) {
                    this.isLoading = true;
                    if(val && val != null) {
                        // this.store_setTableIsLoading(true);
                        this.initTree();
                    }
                }
            },
            heightFP: {
                handler: function (val, oldVal) {
                    if(val && val != null) {
                        this.svgHeight = val+'px';
                    }
                },
                immediate: true
            },
            store_matchedNodes: {
                handler: function (val, oldVal) {
                    this.processMatchedNodes(val);
                }
            },
            store_tableData: {
                handler: function (val, oldVal) {
                    if(val.length == 0) {
                        this.isLoading = true;
                        this.refreshView();
                    }
                }
            },
            store_getTableScrollRow: {
                handler: function (val, oldVal) {
                    this.scrollTreeFromTable(val);
                }
            },
            store_tableIsLoading: {
                handler: function(val, oldval) {
                    this.isLoading = val;
                    if(!val) {
                        this.checkForGraftedNode();
                    }
                }
            }
        },
        data() {
            return {
                //options
                isLoading: false,
                isLazyLoad: false,
                isAnimated: true,
                enableMenu: false,
                showLegend: true,
                showBranchLength: true,
                //constants
                rowLimit_lazyLoad: 25,
                //Layout
                wrapper_d3: null,
                layoutType: "Cluster", //"TopDown",
                treeLayoutObj: null,
                scale: {x: 1.0, y: 1.0},
                currentPan: {x: 0.0, y:0.0},
                //render
                rootNode: null,
                treenodes_view: [],
                origTreenodes: [],
                treelinks_view: [],
                origTreelinks: [],
                //utils
                leafNodesByDepth: [],
                rowsScrolledUp: 0,
                duration: 750,
                link_intersected: null,
                topMostNodePos: {x: 0.0, y: 0.0},
                currentTopNodePos: {x: 0.0, y: 0.0},
                linkDatums: [],
                svgWidth: 700,
                svgHeight: 700,
                //scrollingTreeFromTable
                delayInCall: 20,
                ticking: false,
                timerId: null,
                svgHeight: '1000px'
            }
        },
        mounted() {
            if(this.jsonData) {
                this.store_setTableIsLoading(false);
                this.initTree();
            }
        },
        methods: {
            ...mapActions({
                store_setCenterNode: types.TREE_ACTION_SET_CENTER_NODE,
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
                stateTreeNodes: types.TREE_ACTION_SET_NODES,
                store_setTableIsLoading: types.TABLE_ACTION_SET_TABLE_ISLOADING
            }),
            checkForGraftedNode() {
                if(this.store_getHasGrafted) {
                    var graftedNode = null;
                    let allNodes = this.rootNode.descendants();
                    allNodes.forEach(a => {
                        if(a.data.newGrafted) {
                            graftedNode = a;
                        }
                    });
                    if(graftedNode != null) {
                        setTimeout(() => {
                            this.centerTreeToGivenNode(graftedNode);
                        }, 10);
                    }
                }
            },
            //Scroll tree to so that tree nodes are aligned with table.
            //This method is called when: table is scrolled by a mouse
            scrollTreeFromTable(scroll) {
                //Since a table scroll is registered multiple time, we need to
                // scroll tree only when scrolling by user is done. We do this by starting
                // a timer with a delay of 'delayInCall'. Only after this timer is completed
                // that we call the method to scroll the tree.
                if(!this.ticking) {
                    this.ticking = true;
                    this.timerId = setTimeout(() => {
                        this.ticking = false;
                        let node = this.findNodeFromTree(scroll);
                        if(node) {
                            this.moveTreeToNodePosition(node);
                        }
                    }, this.delayInCall);
                }
                //We clear the timeout if scroll is initiated before the initial timer was completed.
                // This can happen if let's say the delay was 0.5s, but the user is still scrolling. We
                // don't scroll the tree until user has completely stopped scrolling.
                if(this.ticking && this.timerId) {
                    clearTimeout(this.timerId);
                    this.timerId = setTimeout(() => {
                        this.ticking = false;
                        let node = this.findNodeFromTree(scroll);
                        if(node) {
                            this.moveTreeToNodePosition(node);
                        }
                    }, this.delayInCall);
                }
            },
            findNodeFromTree(val) {
                var nodes = this.rootNode.descendants();
                var treeNode = null;
                if(val.id != undefined) {
                    treeNode = nodes.find(n => n.geneId == val.id);
                } else {
                    treeNode = nodes.find(n => n.data.accession == val.accession);
                }
                return treeNode;
            },
            onPruneLoading(isLoad) {
                this.isLoading = isLoad;
            },
            //Resets the d3 wrapper, empties the links and nodes array,
            // which removes the currently displayed tree and all it's components
            refreshView() {
                this.resetRootPosition();
                this.treenodes_view.splice(0, this.treenodes_view.length);
                setTimeout(() => {
                    this.treenodes_view = [];
                    this.treelinks_view = [];
                });
            },
            //Set the d3 svg to it's original position before moving around with mouse
            resetRootPosition() {
                if(this.wrapper_d3 != null) {
                    this.wrapper_d3.transition().duration(500)
                        .attr("transform", (d) => {
                            return "translate(" + 80 + "," + 0 + ")";
                        });
                }
            },
            //Initialize Tree at the time of Mounted() or jsonData has been updated.
            initTree() {
                if(this.jsonData == null) {
                    console.error("jsonData is null!");
                    return;
                }
                this.rowsScrolledUp = 0;
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
                this.$emit('get-table-csv-data', nodes);
                // this.makeDisplayCompact();
                this.initTreeLayout(this.rootNode);
                this.$emit('init-tree', nodes);
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

                this.adjustTreeLayoutPosition(); 
                
                if(this.store_getHasGrafted) {
                    //UpdateTree is called after processing inside
                    this.processGraftedNodes();
                } else {
                    this.updateTree();
                }
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
            async updateTree() {
                this.saveOldPositions(this.rootNode);

                var modifiedNodes = this.rootNode.descendants();
                this.updateExtraInfo(modifiedNodes);

                this.resetTreeLayout();

                setTimeout(() => {
                    this.$emit('updated-tree', modifiedNodes);
                }, 750);

                this.renderNodes(modifiedNodes);
                this.renderLinks(modifiedNodes);

                this.setLeafNodesByDepth(modifiedNodes);

                this.isLoading = false;
                return 1;
            },
            // ~~~~~~~~~ Nodes
            renderNodes(nodes){
                //d3 needs the current nodes to have some data associated with it, 
                // so that when we update the nodes, it can generate proper "Enter", "Exit" and
                // "Updated" nodes based on change in the data.
                // The data we associate is the array of tree nodes "treenodes[]"
                // The treenodes array is still the old array, which is updated using d3 later.
                var oldNodes = d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(this.treenodes_view);
                //modifiedNodes tells d3 which nodes have been modified compared to previously rendered
                // 'treenodes'.
                var nodesData = d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(nodes, function (d) {
                        if(d) {
                            return d.id;
                        }
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
                }
                if(waitForExitNodesToBeRemoved) {
                    setTimeout(() => {
                        this.setTreeNodes(lazyTreenodes);
                    }, 750);
                } else {
                    this.setTreeNodes(lazyTreenodes);
                }
            },
             // ~~~~~~~~~ Links
            renderLinks(nodes) {
                d3.select('.links')
                    .selectAll('path')
                    .data(this.treelinks_view);

                var linksData = d3.select('.links')
                    .selectAll('path')
                    .data(nodes, function (d) {
                        if(d) {
                            return d.id;
                        }
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
                let clickedNodeChildren = [];
                if (this.isAnimated && this.clickedNode) {
                    //add all the children of the clicked node to an array
                    clickedNodeChildren = this.getChildrenIdList(this.clickedNode.source);
                }
                updatedNodes.nodes().forEach(n => {
                    var node_content = n.__data__;
                    if(this.isAnimated) {
                        //the old positions are changed for new entering nodes to be clicked node's position,
                        // so that animation starts from clicked node, and translates to the current posn.
                        if (n.constructor && n.constructor.name === "EnterNode") {
                            if (this.clickedNode) {
                                //Not all "EnterNode" would be just the nodes expanding from the clicked node.
                                // Some are nodes entering because of lazy loading, and we don't need to update it's
                                //old positions.
                                if(clickedNodeChildren.includes(node_content.id)) {
                                    node_content.xo = this.clickedNode.x;
                                    node_content.yo = this.clickedNode.y;
                                }
                            }
                        }
                    } else {
                        //If the nodes are just updating, then old positions are nodes position before
                        // updating the tree layout
                        node_content.xo = node_content.x;
                        node_content.yo = node_content.y;
                    }
                    
                    tempArray.push(node_content);
                });

                //We need to sort the array added by id, because d3 renders based on id of the nodes.
                tempArray.sort((a, b) => {
                    return b.id < a.id;
                });
                return tempArray;
            },
            getModifiedUpdatedLinks(updatedLinks) {
                var tempArray = [];
                let enterNodesArr = [];
                if (this.isAnimated && this.clickedNode) {
                    enterNodesArr = this.getChildrenIdList(this.clickedNode.source);
                }
                updatedLinks.nodes().forEach(n => {
                    var node_content = n.__data__;
                    node_content.enterLink = false;
                    node_content.panUpdate = false;
                    if(this.isAnimated) {
                        if (n.constructor && n.constructor.name === "EnterNode") {
                            if(enterNodesArr.includes(node_content.id)) {
                                node_content.enterLink = true;
                            }
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
            setTreeNodes(nodesArr1) {
                this.treenodes_view.splice(0, this.treenodes_view.length);
                setTimeout(() => {
                    this.treenodes_view = nodesArr1;
                    this.alignTree();
                });
            },
            setTreeLinks(linksArr) {
                this.treelinks_view.splice(0, this.treelinks_view.length);
                setTimeout(() => {
                    this.treelinks_view = linksArr;
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

                let topPadding = rowHeight;
                var topNodePosY = -1*currTopNode.x + 20;
                var topNodePosX = this.currentTopNodePos.x;

                this.wrapper_d3
                    .transition().duration(500)
                    .attr("transform", (d) => {
                        this.setCurrentTopNode({x: topNodePosX, y: topNodePosY});
                        return "translate(" + topNodePosX + "," +  topNodePosY+ ")";
                    });
                let currCenterNode = leafNodes[this.rowsScrolledUp + 8];
                setTimeout(() => {
                    this.store_setCenterNode(currCenterNode);
                }, 100);
            },

            // ~~~~~~~~~~~~~~~~~~~~~~~ Lazy load nodes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateViewOnly() {
                if(!this.isLazyLoad) return;

                this.treenodes_view.splice(0, this.treenodes_view.length);
                this.treelinks_view.splice(0, this.treelinks_view.length);
                let lazyTreenodes = this.origTreenodes;
                let lazyTreelinks = this.origTreelinks;
                
                setTimeout(() => {
                    lazyTreenodes = this.sliceArrayForView(this.origTreenodes);
                    lazyTreenodes.forEach(n => {
                        n.xo = n.x;
                        n.yo = n.y;
                    });
                    lazyTreelinks = this.sliceLinksArrayForView(this.origTreelinks);
                    if(this.isAnimated) {
                        lazyTreelinks.forEach(n => {
                            n.panUpdate = true;
                        });
                    }
                    this.treenodes_view = lazyTreenodes;
                    this.treelinks_view = lazyTreelinks;
                });
            },
            sliceArrayForView(arr) {
                this.sortArrayByX(arr);
                let splitArr = [];
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
                    return rowCount > rowLimit;
                });
                return splitArr;
            },
            sliceLinksArrayForView(arr) {
                this.sortArrayByX(arr);
                let splitArr = [];
                let rowCount = 0;
                let rowLimit = this.rowLimit_lazyLoad;
                if(this.rowsScrolledUp > 0) {
                    rowLimit += this.rowsScrolledUp;
                }
                arr.some(n => {
                    if(!n.children) {
                        rowCount++;
                    }
                    splitArr.push(n);
                    return rowCount > rowLimit+50;
                });
                return splitArr;
            },

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Compact Tree Display ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            //Make the tree layout compact by following some rules defined.
            makeDisplayCompact() {
                updateDisplayUtils.processCompactTree(this.rootNode, this.store_annoMapping.annoMap);
            },

            processGraftedNodes() {
                var allNodes = this.rootNode.descendants();
                nodesUtils.processGrafted(allNodes).then((res) => {
                    this.updateTree();
                });
            },

            // ~~~~~~~~~~~~~~~~ 'Search Within' Matched Node Specific ~~~~~~~~~~~~~~~~~//
            processMatchedNodes(matchedNodes) {
                var allNodes = this.rootNode.descendants();
                nodesUtils.processMatchedNodes(allNodes, matchedNodes).then((res) => {
                    this.updateTree().then(() => {
                        let firstMatchedNode = nodesUtils.findFirstMatchedNodeInTree(this.getLeafNodesByDepth());
                        this.centerTreeToGivenNode(firstMatchedNode);
                    });
                });
            },

            // ~~~~~~~~~~~~~~~~ Tree Layout Specific ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            // Add hasFunc to show flask icon
            addFlask(node){
                node.data.hasFunc = false;
                if(node.children) return;
                let uniprotIds = [];
                this.getUniprotIds(node,uniprotIds);
                const map = this.store_annoMapping;
                uniprotIds.forEach(function(uniprotId){
                        if ( map.annoMap && uniprotId.toLowerCase() in map.annoMap
                            && map.annoMap[uniprotId.toLowerCase()].length > 0 ) {
                                node.data.hasFunc = true;
                        }
                    }
                );
            },
            // Add extra features to nodes of tree
            // Use this function during init
            addExtraInfoToNodes() {
                let index = 0;
                this.rootNode.each(n => {
                    // add flask icon for node with known function
                    this.addFlask(n);

                    n.id = index++;

                    //Check if the node data contains a text we can use
                    if(n.data.text) {
                        n.text = n.data.text;
                    }
                    // n.text = n.id;
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
                } else if(d.grafted) {
                    d.textColor = "#c13291";
                } else {
                    d.textColor = "black";
                }
            },
            //Overwrite each Node positions with custom logic
            setCustomPositionX(d) {
                /** */
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
            
            // ~~~~~~~~~~~~~~~~ Export PNG/SVG ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            onExportSvg(treeId) {
                this.isLoading = true;
                //Svg size is increased to the complete tree size
                this.adjustSvgForExport(false);
                setTimeout(() => {
                    var svgNode = d3.select('#treeSvg').node();
                    exportUtils.downloadSvgLocal(svgNode, treeId)
                        .then(() => {
                            //Reset the svg to it's original size
                            this.resetSvgAfterExport();
                        });
                }, 1000);
            },
            onExportPng(treeId) {
                this.isLoading = true;
                //Svg size is increased to the complete tree size
                this.adjustSvgForExport(true);
                setTimeout(() => {
                    var svgNode = d3.select('#treeSvg').node();
                    var url = exportUtils.createSvgBlobUrl(svgNode);
                    var img = d3.select('span').append('img').node();
                    this.isLoading = false;
                    // start loading the image with the svg blob
                    img.src = url;
                    img.onload = ()=> {
                        setTimeout(() => {
                            this.drawCanvas(img, treeId);
                        }, 1000);
                    }
                }, 1000);
            },
            //Set the width and height of svg to it's full size, 
            // which is then used to download the image.
            // 'fixed': if true, we modify the style to fixed.
            adjustSvgForExport(fixed) {
                //If 'lazyload' is true, the treeview nodes and link are spliced. So, in order to
                // get the complete tree in our final image, we set the tree nodes & links to 
                // have all the nodes and links, which are saved in 'origTreenodes' and 'origTreelinks'
                // which are modified during every update to the tree.
                let allNodes = []; let allLinks = [];
                this.origTreenodes.forEach(n => {
                    allNodes.push(n);
                });
                this.origTreelinks.forEach(n => {
                    allLinks.push(n);
                });
                this.setTreeNodes(allNodes);
                this.setTreeLinks(allLinks);

                var totalLeafNodes = this.getTotalLeafNodes();
                //svgHeight is set by totalLeafNodes * rowHeight (40) + padding, which gives total
                // height for tree when it has all nodes.
                var svgHeight = totalLeafNodes*40 + 50;
                let rightNode = this.getRightmostNode();
                //svgHWidth is set by position of rightmose node + it's text length + some padding
                var svgWidth = rightNode.y + rightNode.text.length * 10 + 200;
                d3.select('#treeSvg').attr("width", svgWidth).attr("height", svgHeight);

                //Set the position to fixed, so that the tree layout does not move based on
                // the svg size increase. If not set, the tree layout moves iut of the screen,
                // and the user will see a blank screen for the time it takes to export and before 
                // reset svg is called.
                // Remember to set svg back to 'relative' once the exporet is done.
                // TODO: The fixed position does not work for '.svg' export.
                if(fixed) {
                    d3.select('#treeSvg').style("position", "fixed");
                } 
            },
            //Draw a canvas element with the 'img' of the svg.
            drawCanvas(img, treeId) {
                //Now that the image has loaded, put the image into a canvas element.
                var svgHeight = this.$refs.treesvg.clientHeight;
                //if tree is greater than 42000 pixels (~1000 genes) in height, the png is
                // divided into 10000 pixels each and saved in parts.
                if(svgHeight > 42000) {
                    for(var i = 0; i< this.$refs.treesvg.clientHeight/10000; i++) {
                        let canvasWidth = this.$refs.treesvg.clientWidth;
                        let canvasHeight = 10000;
                        exportUtils.canvasToPng(img, treeId + "_"+i, canvasWidth, canvasHeight, true, canvasHeight*i);
                    }
                } else {
                    let canvasWidth = this.$refs.treesvg.clientWidth;
                    let canvasHeight = this.$refs.treesvg.clientHeight;
                    if(canvasHeight > 34000) {
                        canvasHeight = 34000;
                    }
                    exportUtils.canvasToPng(img, treeId, canvasWidth, canvasHeight, false);
                }
                this.resetSvgAfterExport();
            },
            resetSvgAfterExport() {
                d3.select('#treeSvg').attr("width", "100%").attr("height", "100%")
                        .style("position", "relative");
                    
                this.isLoading = false;
            },

            // ~~~~~~~~~~~~~~~~ Tree Utils ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            saveOldPositions(root) {
                root.each(d => {
                    d.xo = d.x;
                    d.yo = d.y;
                });
            },
            //sort nodes by 'x' posn in the tree layout (top to bottom)
            sortArrayByX(arr) {
                arr.sort((a, b) => {
                    if(a.x < b.x) {
                        return -1;
                    }
                    if(a.x > b.x) {
                        return 1;
                    }
                    return 0;
                });
            },
            sortArrayByY(arr) {
                arr.sort((a, b) => {
                    if(a.y < b.y) {
                        return -1;
                    }
                    if(a.y > b.y) {
                        return 1;
                    }
                    return 0;
                });
            },
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
            //Get the total count of all the leaf nodes in the tree
            getTotalLeafNodes() {
                var nodes = this.rootNode.descendants();
                this.sortArrayByX(nodes);
                var leafNodes = nodes.filter(n => !n.children);
                return leafNodes.length;
            },
            getTopmostNode(nodes) {
                this.sortArrayByX(nodes);

                var topMostNode = null;
                nodes.some(d => {
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
            setCurrentTopNode(pos) {
                this.currentTopNodePos = pos;
            },
            getChildrenIdList(node) {
                let idList = [];
                if(node.children) {
                    node.children.forEach(cn => {
                        idList.push(cn.id);
                        idList = idList.concat(this.getChildrenIdList(cn));
                    });
                }
                return idList;
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
                this.sortArrayByX(nodes);
                this.leafNodesByDepth = nodes.filter(n => !n.children);
            },
            getRightmostNode() {
                var nodes = this.rootNode.descendants();
                this.sortArrayByY(nodes);
                return nodes[nodes.length-1];
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
            //Recursively Get all uniprotIds for one node
            getUniprotIds(node, uniprotIds){
                if (node.data.uniprotId){
                    uniprotIds.push(node.data.uniprotId);
                }
                if (node._children){
                    node._children.forEach((child)=>{
                        this.getUniprotIds(child, uniprotIds);
                    });
                }
                if (node.children){
                    node.children.forEach((child)=>{
                        this.getUniprotIds(child, uniprotIds);
                    })
                }
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
                // Add flask for node with known function
                this.addFlask(source);
                this.clickedNode = {id: source.id, x: source.x, y: source.y, source: source,};
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
                    // this.updateTree();
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
                this.updateViewOnly();
                this.alignTree();
            },
            moveTreeToNodePosition(node) {
                let leafNodes = this.getLeafNodesByDepth();
                let foundNodeIdx = leafNodes.findIndex(n => n.id === node.id);
                this.rowsScrolledUp = foundNodeIdx;
                this.updateViewOnly();
                this.alignTree();
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
            onDefaultView() {
                this.makeDisplayCompact();
                this.updateTree();
            },
            onExpandAll() {
                this.rootNode.each(d => {
                    if(d._children) {
                        d.children = d._children;
                        d._children = null;
                    }
                    this.addFlask(d);
                });
                this.updateTree();
            },
            onShowLegend() {
                this.showLegend = !this.showLegend;
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
    #treeSvg {
        background-color: white;
        /*cursor: grab;*/
    }
    .menu {
        position: relative;
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

