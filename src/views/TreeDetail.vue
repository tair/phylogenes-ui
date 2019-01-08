<template>
    <div>
        <div class="col1">
            <div class="chart">
                <div class="chart-menu">
                    <span class="d-block p-2 bg-secondary text-dark">Tree Panel for
                        <span class="font-weight-bold">{{ this.treeId }}</span>
                    </span>
                </div>
                <div class="chart-content">
                    <div class="container">
                        <div class="row">
                            <div class="col-sm">
                                <button class="btn btn-outline-warning btn-sm btn-flat text-dark mb-1"
                                        @click="expandAll">Expand All</button>
                            </div>
                            <div class="col-auto">
                                <search-box v-on:search="onSearch"></search-box>
                            </div>
                            <div class="col-sm">
                                <button class="btn btn-outline-warning btn-sm btn-flat text-dark mb-1 float-right"
                                        @click="showLegend">{{showLegendButtonText}}</button>
                            </div>
                        </div>
                    </div>
                    <!--<div class="tree-panel-menu">-->
                            <!--&lt;!&ndash;Branch Length: <span>{{branchLength}}</span>&ndash;&gt;-->
                    <!--</div>-->
                    <div class="tree-box">
                        <!--<treelayout :jsonData="jsonData"-->
                                    <!--v-on:updated-tree="onTreeUpdate"-->
                                    <!--v-on:mouse-over-link="onMouseOverLink"-->
                                    <!--v-on:mouse-leaves-link="onMouseLeaveLink"></treelayout>-->
                        <treelayout2  :jsonData="jsonData" :mappingData="mappingData"
                                      ref="treeLayout"
                                      v-on:updated-tree="onTreeUpdate"></treelayout2>

                    </div>
                </div>
            </div>
        </div>
        <div class="col1">
            <div class="chart">
                <div class="chart-menu">
                    <span class="d-block p-2 bg-secondary text-dark">Table Panel for
                       <span class="font-weight-bold">{{ this.treeId }}</span>
                    </span>
                </div>
                <div class="chart-content">
                    <tablelayout></tablelayout>
                    <!--<intersect></intersect>-->
                </div>
            </div>
        </div>
    </div>

</template>

<script>
    import treelayout2 from '../components/tree/TreeLayout';
    import tablelayout from '../components/table/TableD3';
    import intersect from '../components/tree/Intersection';
    import searchBox from '../components/search/SearchBox';

    import * as d3 from 'd3';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    import * as types from '../store/types_treedata';

    export default {
        name: "TreeDetail",
        components: {
            treelayout2: treelayout2,
            tablelayout: tablelayout,
            intersect: intersect,
            searchBox: searchBox
        },
        computed: {
            ...mapGetters({
                stateTreeJson: types.TREE_GET_JSON,
                stateTreeData: types.TREE_GET_DATA
            }),
            showLegendButtonText(){
                return this.legend?'Hide Legend':'Show Legend';
            }
        },
        data() {
            return {
                treeId: null,
                branchLength: "N/A",
                completeData: null,
                jsonData: null,
                mappingData: null,
                baseUrl: process.env.BASE_URL,
                searchText: "",
                matchNodes: [],
                legend: false
            }
        },
        mounted() {
            console.log(this.treeId);
            this.stateTreeGetJson(this.treeId);
            this.searchText = "";
            this.matchNodes = [];
        },
        methods: {
            ...mapActions({
                stateTreeGetJson: types.TREE_ACTION_GET_JSON,
                store_setMatchedNodes: types.TREE_ACTION_SET_MATCHED_NODES,
                stateSetTreeData: types.TREE_ACTION_SET_DATA,
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
            }),
            onSearch(text) {
                if(text != null) {
                    var d = this.completeData.filter(t => {
                        var geneName = "";
                        if(t["Gene name"] != null && typeof t["Gene name"] != 'number') {
                            geneName = t["Gene name"].toLowerCase();
                        }
                        var geneId = "";
                        if(t["Gene ID"] != null && typeof t["Gene ID"] != 'number') {
                            geneId = t["Gene ID"].toLowerCase();
                        }
                        var uniprotId = "";
                        if(t["Uniprot ID"] != null && typeof t["Uniprot ID"] != 'number') {
                            uniprotId = t["Uniprot ID"].toLowerCase();
                        }
                        text = text.toLowerCase();
                        return geneName === text || geneId === text || uniprotId === text;
                    });
                    this.matchNodes = d;
                } else {
                    this.matchNodes = [];
                }
                this.store_setMatchedNodes(this.matchNodes);
            },
            loadJson(jsonString) {
                var treeJson = JSON.parse(jsonString);
                treeJson = treeJson.search.annotation_node;
                this.formatJson(treeJson);
                this.processJson(treeJson);
                this.completeData = null;
            },
            processJson(treeJson) {
                d3.csv("/organism_to_display.csv", (err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        this.mappingData = data;
                        this.mapOrganismToDisplayName(treeJson);
                        // console.log(treeJson);
                        this.jsonData = treeJson;
                    }
                });
            },
            formatJson(data) {
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
            mapOrganismToDisplayName(node) {
                //Set organism name from mapping data
                if(node.organism) {
                    var found_mapping = this.mappingData.find(o => o.Organism === node.organism);
                    node.displayName = found_mapping.displayName;
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
                    // console.log(d.children[0].data);
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
            // loadJson() {
            //     d3.json("/panther.json", (err, data) => {
            //         if(err) {
            //             console.log(err);
            //         } else {
            //             //console.log(data);
            //             data = data.search.annotation_node;
            //             this.formatJson(data);
            //             this.setNodeColor(data);
            //
            //             console.log(data);
            //             //  assigns the data to a hierarchy using parent-child relationships
            //             var nodes = d3.hierarchy(data, function(d) {
            //                 return d.children;
            //             });
            //
            //             this.jsonData = data;
            //             console.log("Json loaded");
            //             // console.log(nodes);
            //         }
            //     });

            // },
            // ~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            onMouseOverLink(link) {
                this.branchLength = link.data.branch_length;
            },
            onMouseLeaveLink(link) {
                this.branchLength = "N/A";
            },
            onTreeUpdate(nodes) {
                this.updateTableData(nodes);
            },
            expandAll() {
                this.$refs.treeLayout.onExpandAll();
            },
            showLegend() {
                this.$refs.treeLayout.onShowLegend();
                this.legend = !this.legend;
            },
            // ~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateTableData(nodes) {
                var tabularData = [];
                var sortedNodes = nodes.sort(function (a, b) {
                    return a.dfId - b.dfId;
                });

                var index = 0;
                sortedNodes.forEach(n => {
                    if(!n.children) {
                        var tableNode = {};
                        tableNode["id"] = index++;
                        tableNode["Gene name"] = n.data.gene_symbol;
                        var geneId = n.data.gene_id;
                        if (geneId) {
                            geneId = geneId.split(':')[1];
                        }
                        tableNode["Gene ID"] = geneId;
                        tableNode["Organism"] = n.data.organism;
                        tableNode["Protein function"] = n.data.definition;
                        tableNode["Uniprot ID"] = n.data.uniprotId;
                        tabularData.push(tableNode);
                    }
                });
                this.stateSetTreeData(tabularData);
                if(this.completeData == null) {
                    this.completeData = this.stateTreeData;
                }

            }
        },
        watch: {
            '$route.params.id': function (id) {
                this.treeId = id;
                // console.log('ID: ' + this.treeId);
                this.stateTreeGetJson(this.treeId);
            },
            stateTreeJson: {
                handler: function (val, oldVal) {
                    // console.log("Watch ", val);
                    this.loadJson(val);
                }
            }
        },
        created() {
            this.treeId = this.$route.params.id;
            // console.log('ID1: ' + this.treeId);
        }
    }
</script>

<style scoped>
    .chart {
        /*background-color: #ffffff;*/
        border-color: /*#f4a460*/ #fff !important;
        border: 1px solid;
        box-sizing: border-box;
        box-shadow: 0 0 4px 2px rgba(0,0,0,.1);

        position: relative;
        width: 100%;
        height: 100%;
    }
    div.chart-menu {
        width: 100%;
        height: 40px;
        padding: 2px;
        margin: 0;
        box-sizing: border-box;
        background-color: #6C757E;
    }
    div.chart-content {
        height: 900px;
        padding: 15px;
        overflow: hidden;
    }
    .tree-panel-menu {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .col1 {
        width: 50%;
        height: 80%;
        float: left;
    }
</style>