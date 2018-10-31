<template>
    <div>
        <div class="col1">
            <div class="chart">
                <div class="chart-menu">
                    <span class="pt-5 text-primary h3">Tree details for {{ this.treeId }}</span>
                </div>
                <div class="chart-content">
                    <div>
                        <!--Branch Length: <span>{{branchLength}}</span>-->
                        <button class="btn btn-outline-warning btn-sm btn-flat text-dark mb-1"
                                @click="expandAll">Expand All</button>
                        <button class="btn btn-outline-warning btn-sm btn-flat text-dark mb-1 float-right"
                                @click="showLegend">Show Legend</button>
                    </div>
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
                <div class="chart-menu"></div>
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

    import * as d3 from 'd3';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    import * as types from '../store/types_treedata';

    export default {
        name: "TreeDetail",
        components: {
            treelayout2: treelayout2,
            tablelayout: tablelayout,
            intersect: intersect
        },
        computed: {
            ...mapGetters({
                stateTreeJson: types.TREE_GET_JSON
            })
        },
        data() {
            return {
                treeId: null,
                branchLength: "N/A",
                jsonData: null,
                mappingData: null,
                baseUrl: process.env.BASE_URL
            }
        },
        mounted() {
            console.log(this.treeId);
            this.stateTreeGetJson(this.treeId);
        },
        methods: {
            ...mapActions({
                stateTreeGetJson: types.TREE_ACTION_GET_JSON,
                stateSetTreeData: types.TREE_ACTION_SET_DATA,
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
            }),
            loadJson(jsonString) {
                var treeJson = JSON.parse(jsonString);
                treeJson = treeJson.search.annotation_node;
                this.formatJson(treeJson);
                this.processJson(treeJson);
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
                            this.formatJson(d);
                        });
                    }
                }
            },
            mapOrganismToDisplayName(node) {
                if(node.organism) {
                    var found_mapping = this.mappingData.find(o => o.Organism === node.organism);
                    node.displayName = found_mapping.displayName;
                }
                if(node.children) {
                    node.children.forEach(d => {
                        this.mapOrganismToDisplayName(d);
                    });
                }
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
                        //console.log(n.data);
                        // tableNode["id"] = index++;
                        tableNode["Gene name"] = n.data.gene_symbol;
                        var geneId = n.data.gene_id;
                        if (geneId) {
                            geneId = geneId.split(':')[1];
                        }
                        tableNode["Gene ID"] = geneId;
                        tableNode["Organism"] = n.data.organism;
                        tableNode["Protein function"] = n.data.definition;
                        tabularData.push(tableNode);
                    }
                });
                this.stateSetTreeData(tabularData);
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
        border-color: #f4a460!important;
        border: 1px solid;
        box-sizing: border-box;
        box-shadow: 0 0 4px 2px rgba(0,0,0,.1);

        position: relative;
        width: 100%;
        height: 100%;
    }
    div.chart-menu {
        width: 100%;
        height: 35px;
        padding: 2px;
        margin: 0;
        box-sizing: border-box;
        background-color: #f4a460;
    }
    div.chart-content {
        height: 900px;
        padding: 15px;
        overflow: hidden;
    }
    .col1 {
        width: 50%;
        height: 80%;
        float: left;
    }
</style>