<template>
    <svg id="treeSvg" width="900" height="900">
        <g id="wrapper" class="wrapper">
            <g class="links">
                <treelink v-for="link in treelinks" :key="link.id"
                          :content="link">
                </treelink>
            </g>
            <g class="nodes">
                <treenode v-for="node in treenodes" :id="node.id" :key="node.id"
                          ref="treenode"
                          :content="node"
                          v-on:clicknode="onClick"></treenode>
                <p v-for="node in tempnodes" :id="node.id"></p>
            </g>
        </g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';
    import Vue from 'vue';
    import treenode from '../tree/TreeNode';
    import treelink from '../tree/TreeLink';


    export default {
        name: "treelayout2",
        components: {
            'treenode': treenode,
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
                treenodes: [],
                tempnodes: [],
                treelinks: [],
                rootNode: null,
                oldIndexes: [],
                duration: 750,
                index: 0
            }
        },
        mounted() {
            var svg = d3.select('#treeSvg');
            var g = svg.select("#wrapper");
            g.transition().duration(500)
                .attr("transform", (d) => {
                    return "translate(" + 100 + "," + 0 + ")";
                });

            var nodes = d3.hierarchy(this.treeData, function(d) {
                return d.children;
            });

            nodes.each(n => {
               if(!n.id) {
                   n.id = this.index++;
               }
            });

            this.rootNode = nodes;

            this.oldIndexes = [];
            nodes.each(n => {
                this.oldIndexes.push(n);
            });

            this.updateOldIndexes();

            this.tempnodes = [{id: "0"}, {id: "1"}, {id: "2"}, {id: "3"}, {id: "4"}];

            this.initTree();
            this.updateTree(this.rootNode);
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
                var treeLayout = d3.tree()
                    .size([700, 700]);

                treeLayout(this.rootNode);
            },
            getLogs(n) {
                if(!n) {
                    console.log("Undefined");
                } else {
                    console.log("Id: " + n.id + " DataId: " + n.data.id);
                }
            },
            updateOldIndexes() {
                var nodes = this.rootNode.descendants();

                console.log("Old Index Length " + this.oldIndexes.length);
            },
            updateTree(source) {
                // this.renderLinks(nodes);

                d3.select('.nodes')
                    .selectAll('g')
                    .data(this.oldIndexes);

                var nodes = this.rootNode.descendants();

                var nodesData = d3.select('.nodes')
                    .selectAll('g')
                    .data(nodes, function(d) {
                        // console.log(d.id);
                        return d.id;
                    });

                console.log(nodesData);

                const enteringNodes = nodesData.enter();
                const exitingNodes = nodesData.exit();
                const updatedNodes = enteringNodes.merge(nodesData);

                // console.log(exitingNodes.nodes());
                // exitingNodes.each(n => {
                //     this.getLogs(n);
                // });

                if(this.$refs.treenode) {
                    this.$refs.treenode.forEach(n => {
                        // console.log(n.content.id);
                        // n.onExit();
                    });
                }

                // exitingNodes.nodes().forEach(n => {
                //     if(n.__data__) {
                //         var findNode = this.$refs.treenode.find(en => en.content.id == n.__data__.id);
                //         console.log("Exit ", this.clickedNode.id);
                //
                //         findNode.onExit(this.clickedNode);
                //     }
                // });

                exitingNodes.select('circle')
                    .transition().duration(this.duration)
                    .attr('r', 1e-6);

                exitingNodes.transition().duration(this.duration)
                    .attr("transform", d => {
                        return "translate(" + source.y + "," + source.x + ")";
                    })
                    .remove();

                var timeoutS = 0;
                if(exitingNodes.nodes().length > 0) {
                    timeoutS = this.duration;
                }

                setTimeout(() => {
                    this.treenodes.splice(0,  this.treenodes.length);
                    var tempArray = [];
                    updatedNodes.nodes().forEach(n => {
                        var node_content = n.__data__;
                        node_content.x0 = node_content.x;
                        node_content.y0 = node_content.y;
                        if(n.constructor && n.constructor.name === "EnterNode") {
                            if(this.clickedNode) {
                                // console.log("Click ", this.clickedNode.id);
                                node_content.x0 = this.clickedNode.x;
                                node_content.y0 = this.clickedNode.y;
                            }
                        }
                        tempArray.push(node_content);
                    });

                    tempArray.sort((a,b) => {
                       return b.id < a.id;
                    });
                    this.treenodes = tempArray;

                    this.oldIndexes = [];
                    nodes.forEach(n => {
                       this.oldIndexes.push(n);
                    });
                    console.log("Index Size " + this.oldIndexes.length);
                }, timeoutS);
            },
            renderLinks(nodes) {
                var linksData = d3.select('.links')
                    .selectAll('path')
                    .data(nodes.slice(1));

                const enteringLinks = linksData.enter();
                const exitingLinks = linksData.exit();
                const updatedLinks = enteringLinks.merge(linksData);

                exitingLinks.remove();

                //Explain timeout
                setTimeout(() => {
                    // this.treelinks = [];
                    this.treelinks.splice(0,  this.treelinks.length);
                    //Explain temp array
                    var tempArray = [];
                    enteringLinks.each(n => {
                        // console.log(n);
                        if(this.clickedNode) {
                            n.x0 = this.clickedNode.x;
                            n.y0 = this.clickedNode.y;
                        } else {
                            n.x0 = n.x;
                            n.y0 = n.y;
                        }
                        tempArray.push(n);
                    });
                    updatedLinks.each(n => {
                        var findLink = tempArray.find(en => en.id == n.id);
                        if(!findLink) {
                            n.x0 = n.x;
                            n.y0 = n.y;
                            tempArray.push(n);
                        }
                    });

                    tempArray.sort((a,b) => {
                        return b.id < a.id;
                    });
                    this.treelinks = tempArray;
                },10);

                // console.log(this.treelinks);
            },
            onClick(source) {

                var nodes = this.rootNode.descendants();
                // nodes.forEach(n => {
                //     this.getLogs(n);
                // });

                this.clickedNode = source;

                // var oldData = [{id: "0"}, {id: "1"}, {id: "2"}, {id: "3"}, {id: "4"}];
                //
                // var dataSelection = d3.select(".nodes")
                //     .selectAll("p")
                //     .data(oldData);
                //
                // dataSelection = d3.select(".nodes")
                //     .selectAll("p")
                //     .data([{id: "2"}], function(d) {
                //         console.log(d);
                //         return d.id;
                //     });
                //
                // console.log(dataSelection.exit().nodes());

                this.updateTree(source);
            }
        }
    }
</script>

