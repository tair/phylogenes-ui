<template>
    <svg id="treeSvg" width="900" height="900">
        <g id="wrapper" class="wrapper">
            <g class="links">
                <treelink v-for="link in treelinks" :key="link.id"
                          :content="link">
                </treelink>
            </g>
            <g class="nodes">
                <treenode v-for="node in treenodes" :key="node.id"
                          :content="node"
                          v-on:clicknode="onClick"></treenode>
            </g>
        </g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';

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
                                    name: "OneOneOne"
                                },
                                {
                                    id: 112,
                                    name: "OneOneTwo"
                                }
                            ]
                        },
                        {id: 12,
                         name: "Twelve"},
                    ]
                },
                treenodes: [],
                treelinks: [],
                rootNode: null,
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
            this.initTree();
            this.updateTree(this.rootNode);
        },
        methods: {
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
            updateTree(source) {
                var nodes = this.rootNode.descendants();

                this.renderLinks(nodes);

                var nodesData = d3.select('.nodes')
                    .selectAll('g')
                    .data(nodes);

                const enteringNodes = nodesData.enter();
                const exitingNodes = nodesData.exit();
                const updatedNodes = enteringNodes.merge(nodesData);

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
                    // console.log(updatedNodes.nodes());
                    // updatedNodes.nodes().forEach(n => {
                    //     console.log(n);
                    // });
                    enteringNodes.each(n => {
                        if(this.clickedNode) {
                            n.x0 = this.clickedNode.x;
                            n.y0 = this.clickedNode.y;
                        } else {
                            n.x0 = n.x;
                            n.y0 = n.y;
                        }
                        tempArray.push(n);
                    });
                    updatedNodes.each(n => {
                        var findNode = tempArray.find(en => en.id == n.id);
                        if(!findNode) {
                            n.x0 = n.x;
                            n.y0 = n.y;
                            tempArray.push(n);
                        }
                    });
                    tempArray.sort((a,b) => {
                       return b.id < a.id;
                    });
                    this.treenodes = tempArray;
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

                setTimeout(() => {
                    this.treelinks.splice(0,  this.treelinks.length);
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

                console.log(this.treelinks);
            },
            onClick(source) {
                this.clickedNode = source;
                this.updateTree(source);
            }
        }
    }
</script>

