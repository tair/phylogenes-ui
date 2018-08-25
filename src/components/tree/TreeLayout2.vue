<template>
    <svg id="treeSvg" width="900" height="900">
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
                <treenode2  v-for="node in treenodes2" :id="node.id"
                            ref="treenode"
                            :content="node"
                            v-on:clicknode="onClick"></treenode2>
            </g>

            <dragnode ref="nodeToAdd" :content="exampleNode"></dragnode>
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
                        {id: 11,
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
                        {id: 12,
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
                rootNode: null,
                oldIndexes: [],
                scale: {x: 1.0, y: 1.0},
                duration: 750,
                index: 0,
                counter: 0,
                topPaddingY: 120,
                rowHeight: 40
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
            //
            // nodes.each(n => {
            //    if(!n.id) {
            //        n.id = this.index++;
            //    }
            // });

            if(this.jsonData != null) {
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
                for(var i in obj) {
                    if(obj[i] != null &&  typeof(obj[i])=="object")
                        clone[i] = this.cloneObject(obj[i]);
                    else
                        clone[i] = obj[i];
                }
                return clone;
            },
            initTree() {
                this.rootNode = this.jsonData;

                this.rootNode.each(n => {
                    if(!n.id) {
                        n.id = this.index++;
                    }
                    n.text = this.getText(n);
                });

                this.updateOldIndexes(this.rootNode.descendants());

                var treeLayout = d3.tree()
                    .size([800, 800]);

                treeLayout(this.rootNode);

                this.updateTree(this.rootNode);
            },
            getText(d) {
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
            },
            getLogsForNodes(n) {

            },
            getLogs(n) {
                if(!n) {
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
            updateOldIndexes(nodes) {
                this.oldIndexes = [];
                nodes.forEach(n => {
                    this.oldIndexes.push(n);
                });
                // console.log("Index Size " + this.oldIndexes.length);
            },
            updateAccordingToDepth(nodes, flag) {
                this.counter = 0;
                this.calculateDepthFirstIds(nodes[0]);
                //Arrange nodes position by depth ids.
                nodes.forEach(d => {
                    this.setCustomPositionX(d);
                });
                // console.log(nodes[2]);
            },
            updateTree(source) {

                //Explain: why old Indexes?
                d3.select('.nodes')
                    .selectAll('g')
                    .data(this.oldIndexes);
                // console.log(this.oldIndexes);

                var nodes = this.rootNode.descendants();
                this.rootNode.xo = this.rootNode.x;
                this.rootNode.yo = this.rootNode.y;
                this.updateAccordingToDepth(nodes);
                // console.log(nodes);

                this.renderLinks(nodes);

                var nodesData = d3.select('.nodes')
                    .selectAll('g')
                    .data(nodes, function(d) {
                        // console.log(d.id);
                        return d.id;
                    });
                // console.log(nodesData);

                const enteringNodes = nodesData.enter();
                const exitingNodes = nodesData.exit();
                const updatedNodes = enteringNodes.merge(nodesData);

                exitingNodes.nodes().forEach(n => {
                    if(n.__data__) {
                        var findNode = this.$refs.treenode.find(en => en.content.id == n.__data__.id);
                        // console.log(this.clickedNode.id + "-" + this.clickedNode.x + "," + this.clickedNode.y);
                        findNode.onExit(this.clickedNode);
                    }
                });

                var timeoutS = 0;
                if(exitingNodes.nodes().length > 0) {
                    timeoutS = this.duration;
                }

                setTimeout(() => {
                    this.treenodes.splice(0,  this.treenodes.length);
                    this.treenodes2.splice(0,  this.treenodes2.length);
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
                            if(n.__data__.children == null) {
                                tempArray2.push(node_content);
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
                    }, 1);
                }, timeoutS);
            },
            renderLinks(nodes) {
                d3.select('.links')
                    .selectAll('path')
                    .data(this.oldIndexes.slice(1));

                var linksData = d3.select('.links')
                    .selectAll('path')
                    .data(nodes.slice(1), function(d) {
                        return d.id;
                    });

                const enteringLinks = linksData.enter();
                const exitingLinks = linksData.exit();
                const updatedLinks = enteringLinks.merge(linksData);

                // exitingLinks
                //     .duration(this.duration)
                //     .attr('d', d => {
                //         var o = {x: source.x, y: source.y};
                //         return this.diagonal(o, o)
                //     })
                //     .remove();
                exitingLinks.nodes().forEach(n => {
                    if(n.__data__) {
                        var findLink = this.$refs.treelink.find(en => en.content.id == n.__data__.id);
                        findLink.onExit(this.clickedNode);
                    }
                });

                //Explain timeout
                var timeoutS = 0;
                if(exitingLinks.nodes().length > 0) {
                    timeoutS = this.duration;
                }

                setTimeout(() => {
                    // this.treelinks = [];
                    this.treelinks.splice(0,  this.treelinks.length);
                    setTimeout(() => {
                        //Explain temp array
                        var tempArray = [];
                        // console.log(updatedLinks);
                        updatedLinks.nodes().forEach(n => {
                            var node_content = n.__data__;
                            // console.log(node_content);
                            // node_content.x0 = node_content.x;
                            // node_content.y0 = node_content.y;
                            node_content.enterLink = false;
                            if (n.constructor && n.constructor.name === "EnterNode") {
                                node_content.enterLink = true;
                                // console.log(node_content);
                                if (this.clickedNode) {
                                    // console.log("Click ", this.clickedNode.id);
                                    // node_content.x0 = this.clickedNode.x;
                                    // node_content.y0 = this.clickedNode.y;
                                }
                            }
                            tempArray.push(node_content);
                        });

                        tempArray.sort((a, b) => {
                            return b.id < a.id;
                        });
                        this.treelinks = tempArray;
                    }, 0);
                },timeoutS);
                // console.log(this.treelinks);
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
                    var oldX = d.x;
                    var oldY = d.y;
                    var newX = this.topPaddingY + d.dfId * this.rowHeight;

                    if(d.id == 1) {
                        // console.log(d.id + " N : " + newX + " O: " + oldX);
                    }
                    //
                    d.x = newX;
                    d.xo = oldX;
                    d.yo = oldY;
                    // console.log(d);
                }
            },
            onClick(source) {
                // console.log(source.id + "-" + source.x + "," + source.y);
                this.clickedNode = {id: source.id, x: source.x, y: source.y};

                this.updateTree(source);
            }
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

