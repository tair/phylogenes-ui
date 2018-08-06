<template>
    <div>
        <div class="col-sm-12">
        tree details for <h3>{{ this.treeId }}</h3>
        </div>
        <div class="col1">
            <div class="chart">
                <div class="chart-menu"></div>
                <div class="chart-content">
                    <div style="height: 20px">
                        Branch Length: <span>{{branchLength}}</span>
                    </div>
                    <div class="tree-box">
                        <treelayout :jsonData="jsonData"
                                    v-on:updated-tree="onTreeUpdate"
                                    v-on:mouse-over-link="onMouseOverLink"
                                    v-on:mouse-leaves-link="onMouseLeaveLink"></treelayout>

                    </div>
                </div>
            </div>
        </div>
        <div class="col1">
            <div class="chart">
                <div class="chart-menu"></div>
                <div class="chart-content">
                    <tablelayout></tablelayout>
                </div>
            </div>
        </div>
    </div>

</template>

<script>
    import treelayout from '../components/tree/TreeLayout';
    import tablelayout from '../components/table/TableD3';

    import * as d3 from 'd3';
    import {mapActions} from 'vuex';

    import * as types from '../store/types_treedata';

    export default {
        name: "TreeDetail",
        components: {
            treelayout: treelayout,
            tablelayout: tablelayout
        },
        data() {
            return {
                treeId: null,
                branchLength: "N/A",
                jsonData: null,
                baseUrl: process.env.BASE_URL
            }
        },
        mounted() {
            this.loadJson();
        },
        methods: {
            ...mapActions({
                stateSetTreeData: types.TREE_ACTION_SET_DATA,
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM
            }),
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
            loadJson() {
                d3.json("/panther.json", (err, data) => {
                    if(err) {
                        console.log(err);
                    } else {
                        //console.log(data);
                        data = data.search.annotation_node;
                        this.formatJson(data);

                        // console.log(data);
                        //  assigns the data to a hierarchy using parent-child relationships
                        var nodes = d3.hierarchy(data, function(d) {
                            return d.children;
                        });

                        this.jsonData = nodes;
                        console.log("Json loaded");
                        // console.log(nodes);
                    }
                });
            },
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
            // ~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateTableData(nodes) {
                var tabularData = [];
                var sortedNodes = nodes.sort(function (a, b) {
                    return a.dfId - b.dfId;
                });
                sortedNodes.forEach(n => {
                    var tableNode = {};
                    //console.log(n.data);
                    tableNode["Accession"] = n.data.accession;
                    tableNode["Gene Id"] = n.data.gene_id;
                    tableNode["Gene Name"] = n.data.gene_symbol;
                    tableNode["Organism"] = n.data.organism;
                    tableNode["Definition"] = n.data.definition;
                    tableNode["Subfamily Name"] = n.data.sf_name;
                    tabularData.push(tableNode);
                });
                this.stateSetTreeData(tabularData);
            }

        },
        watch: {
            '$route.params.id': function (id) {
                this.treeId = id;
                console.log('ID: ' + this.treeId);
            }
        },
        created() {
            this.treeId = this.$route.params.id;
            console.log('ID1: ' + this.treeId);
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
        float: left;
    }
</style>