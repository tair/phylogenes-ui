<template>
    <span class="_parent">
        <button class="btn btn-outline-danger btn-sm btn-flat text-dark mb-1 float-left"
                @click="exportPng">PNG</button>
        <a id="download" download="image.png">
            <button class="btn btn-outline-danger btn-sm btn-flat text-dark mb-1 float-left"
                    @click="downloadPng">Download</button>
        </a>

        <svg id="treeSvg" ref="treesvg" :width="svgWidth" :height="svgHeight">
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
                                :content="node"></basenode>
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

    import baseNode from '../tree/nodes/BaseTreeNode';
    import baseLink from '../tree/links/BaseTreeLink';

    import contextMenu from '../menu/ContextMenu';
    import treeLegend from '../tree/Legend';

    import intersectUtil from "../../util/intersect";

    export default {
        name: "treelayoutsave",
        props: ['jsonData'],
        components: {
            'basenode': baseNode,
            'baselink': baseLink,
            'context-menu': contextMenu,
            'tree-legend': treeLegend
        },
        computed: {
            ...mapGetters({
                stateTreeJson: types.TREE_GET_JSON,
            })
        },
        created() {
            this.treeId = this.$route.params.id;
            this.loadJsonFromDB(this.treeId);
        },
        watch: {
            '$route.params.id': function (id) {
                this.treeId = id;
            },
            stateTreeJson: {
                handler: function (val, oldVal) {
                    this.loadJson(val);
                }
            },
            jsonData: {
                deep: true,
                handler: function (val, oldVal) {
                    this.isLoading = true;
                    if(val != null) {
                        this.initTree();
                    }
                }
            },
        },
        data() {
            return {
                treeId: null,
                svgWidth: 700,
                svgHeight: 700,
                mappingData: null,
                 //options
                isLoading: false,
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
                //png
                url: null
            }
        },
        mounted() {
            // this.initBlob();
            // this.loadJson();
            let canvasNode = d3.select('canvas');
            if(canvasNode) {
                canvasNode.remove();
            }
        },
        methods: {
            ...mapActions({
                loadJsonFromDB: types.TREE_ACTION_GET_JSON,
            }),
            downloadPng() {
                var download = document.getElementById("download");
                var image = document.getElementById("canvas").toDataURL("image/png")
                            .replace("image/png", "image/octet-stream");
                download.setAttribute("href", image);
            },
            exportPng() {
                var doctype = '<?xml version="1.0" standalone="no"?>'
                            + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

                // serialize our SVG XML to a string.
                var svgNode = d3.select('svg').node();
               
                var cssStyleText = this.getCSSStyles(svgNode);
                this.appendCss(cssStyleText, svgNode);
                // console.log(this.getBottommostNode());

                var source = (new XMLSerializer()).serializeToString(svgNode);
                // create a file blob of our SVG.
                var blob = new Blob([ doctype + source], { type: 'image/svg+xml;charset=utf-8' });

                this.url = window.URL.createObjectURL(blob);

                // Put the svg into an image tag so that the Canvas element can read it in.
                var img = d3.select('span').append('img').node();
                img.onload = ()=> {
                    console.log("on load");
                    //Now that the image has loaded, put the image into a canvas element.
                    var canvas = d3.select('body').append('canvas').node();
                    canvas.width = this.svgWidth;
                    canvas.height = this.svgHeight;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    // var png = canvas.toDataURL("image/png");

                    canvas.toBlob((blob) => {
                        console.log(blob.size);
                        let URLObj = window.URL || window.webkitURL;
                        let a = document.createElement("a");  
                        a.href = URLObj.createObjectURL(blob);
                        a.download = this.treeId+".png";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    })

                    // var canvasUrl = canvas.toDataURL("image/png")
                    //                         .replace("image/png", "image/octet-stream");
                    // window.location.href=canvasUrl;
                    // var img2 = d3.select('body').append('img')
                    //     .attr('width', 400)
                    //     .attr('height', 400)
                    //     .node();
                    // this is now the base64 encoded version of our PNG! you could optionally 
                    // redirect the user to download the PNG by sending them to the url with 
                    // `window.location.href= canvasUrl`.
                    // img2.src = canvasUrl; 
                }

                // start loading the image.
                img.src = this.url;
            },
            getCSSStyles(parentElement) {
                var selectorTextArr = [];
                // Add Parent element Id and Classes to the list
                selectorTextArr.push( '#'+parentElement.id );

                for (var c = 0; c < parentElement.classList.length; c++)
                    if ( !selectorTextArr.includes('.'+parentElement.classList[c]) )
                        selectorTextArr.push( '.'+parentElement.classList[c] );

                // Add Children element Ids and Classes to the list
                var nodes = parentElement.getElementsByTagName("*");
                for (var i = 0; i < nodes.length; i++) {
                    var id = nodes[i].id;
                    if ( !selectorTextArr.includes('#'+id) )
                        selectorTextArr.push( '#'+id );

                    var classes = nodes[i].classList;
                    for (var c = 0; c < classes.length; c++)
                        if ( !selectorTextArr.includes('.'+classes[c]) )
                            selectorTextArr.push( '.'+classes[c] );
                }
                // console.log(selectorTextArr);

                // Extract CSS Rules
                var extractedCSSText = "";
                for (var i = 0; i < document.styleSheets.length; i++) {
                    var s = document.styleSheets[i];
                    // console.log(s);

                    // try {
                    //     if(!s.cssRules) continue;
                    // } catch( e ) {
                    //     if(e.name !== 'SecurityError') throw e; // for Firefox
                    //     continue;
                    // }

                    var cssRules = s.cssRules;
                    for (var r = 0; r < cssRules.length; r++) {
                        if(cssRules[r].selectorText && 
                            (cssRules[r].selectorText.includes("#node") ||
                                cssRules[r].selectorText.includes("#link") ||
                                    cssRules[r].selectorText.includes("#treeSvg"))) {
                            extractedCSSText += cssRules[r].cssText;
                        }
                    }
                }
                return extractedCSSText;
            },
            appendCss(cssText, element) {
                var styleElement = document.createElement("style");
                styleElement.setAttribute("type","text/css"); 
                styleElement.innerHTML = cssText;
                var refNode = element.hasChildNodes() ? element.children[0] : null;
                element.insertBefore( styleElement, refNode );
            },
            processJson(treeJson) {
                d3.csv("/organism_to_display.csv", (err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        this.mappingData = data;
                        this.mapOrganismToDisplayName(treeJson, data);
                        //  assigns the data to a hierarchy using parent-child relationships
                        this.rootNode = d3.hierarchy(treeJson, function(d) {
                            return d.children;
                        });
                        this.initTree();
                    }
                });
            },
            mapOrganismToDisplayName(node) {
                //Set organism name from mapping data
                if(node.organism) {
                    var found_mapping = this.mappingData.find(o => o.Organism.toLowerCase() === node.organism.toLowerCase());
                    if(found_mapping) {
                        node.displayName = found_mapping.displayName.trim();
                    }
                }
                //Set Text for each node if present
                let text = this.getText(node);
                if (text != null) {
                    node.text = text;
                }
                //Set fill color for each node
                let fillColor = this.getNodeColor(node);
                if(fillColor) {
                    node.fillColor = fillColor;
                }
                if(node.children) {
                    node.children.forEach(d => {
                        this.mapOrganismToDisplayName(d);
                    });
                }
            },
            //Set Text for nodes based on event type
            getText(d) {
                var text = d.id;
                text = "";
                if(!d) return null;

                if(d.event_type) {
                    if (d.event_type === "DUPLICATION") {
                        if (d.speciation_event) {
                            text += d.speciation_event;
                        } else {
                            text += this.getLeafNodeText(d);
                        }
                    } else if(d.event_type === "SPECIATION") {
                        if (d.speciation_event) {
                            text += d.speciation_event;
                        }
                    } else if(d.event_type === "HORIZONTAL_TRANSFER" ||
                        d.event_type === "HORIZ_TRANSFER") {
                        if (d.speciation_event) {
                            text += d.speciation_event;
                        }
                    }
                    return text;
                }
                if (d.speciation_event) {
                    text += d.speciation_event;
                }
                if(!d.children) {
                    if(d.gene_symbol) {
                        text += " " + d.gene_symbol;
                    } else {
                        var geneId = d.gene_id;
                        geneId = geneId.split(":")[1];
                        text += " " + geneId;
                    }
                    if(d.displayName) {
                        text += " (";
                        text += d.displayName;
                        text += ") ";
                    }
                }
                return text;
            },
            getLeafNodeText(d) {
                if(d.children) {
                    return d.children[0].organism;
                }
                return "Leaf Node";
            },
            getNodeColor(d) {
                if(d.sf_id) {
                    return "#0000FF";
                }
                if(d.event_type) {
                    if(d.event_type === "DUPLICATION") {
                        return "#FFA500";
                    } else if(d.event_type === "HORIZONTAL_TRANSFER" ||
                        d.event_type === "HORIZ_TRANSFER") {
                        return "#00FFFF";
                    }
                }
                return "#00FF00";
            },
            loadJson(jsonString) {
                var data = JSON.parse(jsonString);
                data = data.search.annotation_node;
                this.formatJson(data);
                this.processJson(data);
                
            },
            initTree() {
                var svg = d3.select('#treeSvg');
                this.wrapper_d3 = svg.select("#wrapper");

                this.initTreeLayout(this.rootNode);
                this.addExtraInfoToNodes();
                this.adjustTreeLayoutPosition();
                this.updateTree();
            },
            addExtraInfoToNodes() {
                this.rootNode.each(n => {
                    //Check if the node data contains a text we can use
                    if(n.data.text) {
                        n.text = n.data.text;
                    }
                    if(n.data.fillColor) {
                        n.fillColor = n.data.fillColor;
                    }
                    n.type = this.getNodeType(n);
                    if(!n.children) {
                        n.hideShape = true;
                    } else {
                        n.hideShape = false;
                    }
                });
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
            formatJson(data) {
                if(data.node_name) {
                    var uniprotId = data.node_name;
                    uniprotId = uniprotId.split("UniProtKB=")[1];
                    data.uniprotId = uniprotId;
                }
                if(data.children) {
                    if(data.children.annotation_node) {
                        data.children = data.children.annotation_node;
                        data.children.forEach(d => {
                            if(d.node_name) {
                                var uniprotId = d.node_name;
                                uniprotId = uniprotId.split("UniProtKB=")[1];
                                d.uniprotId = uniprotId;
                            }
                            this.formatJson(d);
                        });
                    }
                }
            },
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
                let nodes = this.rootNode.descendants();
                this.setBranchLength(nodes);
            },
            updateTree() {
                this.saveOldPositions(this.rootNode);
                var modifiedNodes = this.rootNode.descendants();
                this.updateExtraInfo(modifiedNodes);
                this.renderNodes(modifiedNodes);
                this.renderLinks(modifiedNodes);
            },
            // Updates extra features
            // Use this function during update
            updateExtraInfo(nodes) {
                nodes.forEach(d => {
                    d.type = "Circle";
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
            renderNodes(nodes) {
                var oldNodes = d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(this.treenodes_view);
                //modifiedNodes tells d3 which nodes have been modified compared to previously rendered
                // 'treenodes'.
                var nodesData = d3.select('.nodes')
                    .selectAll('g.shape')
                    .data(nodes, function (d) {
                        return d.id;
                    });
                
                const enteringNodes = nodesData.enter();
                const updatedNodes = enteringNodes.merge(nodesData);
                let tnodes = this.getModifiedUpdatedNodes(updatedNodes);
                this.treenodes_view.splice(0, this.treenodes_view.length);
                setTimeout(() => {
                    this.treenodes_view = tnodes;
                });
            },
            renderLinks(nodes) {
                d3.select('.links')
                    .selectAll('path')
                    .data(this.treelinks_view);

                var linksData = d3.select('.links')
                    .selectAll('path')
                    .data(nodes, function (d) {
                        return d.id;
                    });

                const enteringLinks = linksData.enter();
                const updatedLinks = enteringLinks.merge(linksData);

                let tlinks = this.getModifiedUpdatedLinks(updatedLinks);              
                this.treelinks_view.splice(0, this.treelinks_view.length);
                setTimeout(() => {
                    this.treelinks_view = tlinks;
                });
            },
            //Add node content from d3 updatedNodes to an array sorted by n.id and customized
            getModifiedUpdatedNodes(updatedNodes) {
                var tempArray = [];
                updatedNodes.nodes().forEach(n => {
                    var node_content = n.__data__;
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
                    tempArray.push(node_content);
                });

                tempArray.sort((a, b) => {
                    return b.id < a.id;
                });
                return tempArray;
            },
            saveOldPositions(root) {
                root.each(d => {
                    d.xo = d.x;
                    d.yo = d.y;
                });
            },
            adjustTreeLayoutPosition() {
                this.adjustSvgDims();
                this.alignTree();
            },
            adjustSvgDims() {
                var totalLeafNodes = this.getTotalLeafNodes();
                this.svgHeight = totalLeafNodes*40 + 50;
                let rightNode = this.getRightmostNode();
                this.svgWidth = rightNode.y + rightNode.text.length * 10 + 100;
                // console.log(rightNode.text.length+"-"+rightNode.y+" - "+this.svgWidth);
            },
            alignTree() {
                if(this.wrapper_d3 == null) return;

                this.rowsScrolledUp=0;
                let svgHeight = 700;
                let rowHeight = 40;
                let totalRowsInPanel = Math.floor(svgHeight/rowHeight);

                var currTopNode = this.getTopmostNode();

                let topPadding = rowHeight;
                var topNodePosY = -1*currTopNode.x + topPadding;
                var topNodePosX = 50;

                this.wrapper_d3
                    .attr("transform", (d) => {
                        return "translate(" + topNodePosX + "," +  topNodePosY+ ")";
                    });
            },
            getTopmostNode() {
                let nodes = this.rootNode.descendants();
                this.sortArrayByX(nodes);

                var topMostNode = null;
                nodes.some(d => {
                    topMostNode = d;
                    return !d.children;
                });
                return topMostNode;
            },
            getBottommostNode() {
                var nodes = this.rootNode.descendants();
                this.sortArrayByX(nodes);
                return nodes[nodes.length-1];
            },
            getRightmostNode() {
                var nodes = this.rootNode.descendants();
                this.sortArrayByY(nodes);
                return nodes[nodes.length-1];
            },
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
            getTotalLeafNodes(nodes) {
                var nodes = this.rootNode.descendants();
                this.sortArrayByX(nodes);
                var leafNodes = nodes.filter(n => !n.children);
                return leafNodes.length;
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
            // loadJson() {
            //     var svg = d3.select('#treeSvg');
            //     this.wrapper_d3 = svg.select("#wrapper");
                
            //     d3.json("/panther_simple.json", (err, data) => {
            //         if(err) {
            //             console.log(err);
            //         } else {
            //             data = data.search.annotation_node;
            //             this.formatJson(data);
            //             // this.setNodeColor(data);
            
            //             //  assigns the data to a hierarchy using parent-child relationships
            //            this.rootNode = d3.hierarchy(data, function(d) {
            //                 return d.children;
            //             });

            //             this.initTreeLayout(this.rootNode);
            //             this.updateTree();
            //             this.wrapper_d3
            //                 .attr("transform", (d) => {
            //                     return "translate(" + 80 + "," + 150 + ")";
            //                 });
            //         }
            //     });
            // },
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
    .legend-box {
        background-color: #9E9E9E;
        position: absolute;
        top: 1px;
        right: 5px;
        width: 230px;
        float: left;
    }
    
</style>

