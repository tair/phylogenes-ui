<template>
    <div id="main" class="container-fluid main_container bg-pggrey d-flex">
        <modal v-if="showPopup" @close="showPopup = false">
            <div slot="header">{{popupHeader}}</div>
            <template slot="body" slot-scope="props">
                <popupTable v-if="popupData.length > 0" :data="popupData" :cols="popupCols"></popupTable>
                <div v-if="popupData.length===0"><i>No Go Annotations for this gene!</i></div>
            </template>
        </modal>
        <div class="row flex-fill">
            <!-- Metadata Band -->
            <div class="col-sm-12 h-5 d-flex align-items-center text-danger pg-databand">
                <i v-if="this.metadata.isLoading" 
                    class="fa fa-spinner fa-spin fa-2x p-5 text-primary"></i>
                <span v-if="!this.metadata.isLoading" v-on:click="showOrganismPopup()">
                    {{metadata.familyName}} ({{treeId}}), {{metadata.genesCount}} genes, 
                    <span style="cursor: pointer"><b><u>
                        {{metadata.uniqueOrganisms.totalCount}} organisms</u></b></span>
                    , spanning {{this.metadata.spannedTaxon}}
                </span>
            </div>
            <!-- Tree Panel -->
            <div class="col-sm-6 h-95 pg-panel">
                <div class="row h-100">
                    <!-- Menu Bar -->
                    <div class="col-sm-12 h-5">
                        <div class="row align-items-center">
                            <div class="col-sm align-items-center">
                                <button class="btn btn-outline-danger btn-sm btn-flat text-dark mb-1"
                                            @click="expandAll">Expand All</button>
                            </div>
                            <div class="col-auto align-items-center">
                                <search-box v-on:search="onSearch"></search-box>
                            </div>
                            <div class="col-sm align-items-center">
                                <button class="btn btn-outline-danger btn-sm btn-flat text-dark mb-1 float-right"
                                        @click="showLegend">{{showLegendButtonText}}</button>
                                <!-- For Testing -->
                                <!--<button class="btn btn-outline-warning btn-sm btn-flat text-dark mb-1 float-right"-->
                                        <!--@click="moveUp">Move UP</button>-->
                            </div>
                        </div>
                    </div>
                    <!-- Tree SVG Component -->
                    <div class="col-sm-12 h-95">
                        <treelayout  :jsonData="jsonData" :mappingData="mappingData"
                                        ref="treeLayout"
                                        v-on:init-tree="onTreeInit"
                                        v-on:updated-tree="onTreeUpdate"></treelayout>
                    </div>
                </div>    
            </div>
            <!-- Table Panel -->
            <div class="col-sm-6 h-95 pg-panel">
                <div class="row h-100">
                    <!-- table component -->
                    <div class="col-sm-12 h-100">
                        <tablelayout></tablelayout>
                    </div>
                </div>
            </div>
    </div>
    </div>

</template>

<script>
    import treelayout from '../components/tree/TreeLayout';
    import tablelayout from '../components/table/TableD3';
    import intersect from '../components/tree/Intersection';
    import searchBox from '../components/search/SearchBox';

    import * as d3 from 'd3';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    import * as types from '../store/types_treedata';
    import customModal from '@/components/modal/CustomModal';
    import popupTableOrganism from '@/components/table/PopupTableOrganism';

    export default {
        name: "TreeDetail",
        components: {
            treelayout: treelayout,
            tablelayout: tablelayout,
            intersect: intersect,
            searchBox: searchBox,
            'modal': customModal,
            popupTable: popupTableOrganism
        },
        computed: {
            ...mapGetters({
                stateTreeJson: types.TREE_GET_JSON,
                stateTreeData: types.TREE_GET_DATA,
                stateTreeAnnotations: types.TREE_GET_ANNOTATIONS,
                store_getTreeMetadata: types.TREE_GET_METADATA
            }),
            showLegendButtonText(){
                return this.legend?'Hide Legend':'Show Legend';
            }
        },
        watch: {
            '$route.params.id': function (id) {
                this.treeId = id;
                this.jsonData = null;
                this.loadJsonFromDB(this.treeId);
                this.stateSetTreeData([]);
                this.metadata.isLoading = true;
            },
            stateTreeJson: {
                handler: function (val, oldVal) {
                    this.loadJson(val);
                }
            },
            stateTreeAnnotations: {
                handler: function (val, oldVal) {
                    this.loadAnnotations(val);
                }
            },
            store_getTreeMetadata: {
                handler: function (val, oldVal) {
                    this.metadata.familyName = val.familyName[0];
                    this.metadata.spannedTaxon = val.taxonRange;
                    this.metadata.isLoading = false;
                }
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
                anno_mapping: {},
                anno_headers: [],
                legend: true,
                metadata: {
                    isLoading: false,
                    familyName: "",
                    genesCount: 0,
                    uniqueOrganisms: {
                        totalCount: 0,
                        organisms: []
                    },
                    spannedTaxon: ""
                },
                showPopup: false,
                popupHeader: "Organisms",
                popupCols: ["Organism", "Number of genes"],
                popupData: [],
                popupTableConfig: {
                    tableHeight: 'auto',
                    tableWidth: 'auto',
                    colsWidth: ['300px', '100px']
                }
            }
        },
        mounted() {
            this.loadJsonFromDB(this.treeId);
            this.searchText = "";
            this.matchNodes = [];
            this.popupData = [];
            this.metadata.isLoading = true;
        },
        methods: {
            ...mapActions({
                loadJsonFromDB: types.TREE_ACTION_GET_JSON,
                store_setMatchedNodes: types.TREE_ACTION_SET_MATCHED_NODES,
                store_setAnnoMapping: types.TREE_ACTION_SET_ANNO_MAPPING,
                stateSetTreeData: types.TREE_ACTION_SET_DATA,
                stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
            }),
            showOrganismPopup() {
                this.showPopup = true;
                this.popupData = [];
                this.metadata.uniqueOrganisms.organisms.forEach(o => {
                    let singleRow = [];
                    singleRow.push(o.name);
                    singleRow.push(o.count);
                    this.popupData.push(singleRow); 
                });
            },
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
            resetDataband() {
                this.metadata = {
                    isLoading: true,
                    familyName: "",
                    genesCount: 0,
                    uniqueOrganisms: {
                        totalCount: 0,
                        organisms: []
                    },
                    spannedTaxon: ""
                };
            },
            loadJsonFromFile(fileName) {
              d3.json("/sam_annotations_simple.json", (err, data) => {
                  if (err) {
                      console.log(err);
                  } else {
                      this.loadAnnotations(data);
                  }
              });
            },
            loadAnnotations(annotations) {
                this.anno_mapping = {};
                this.anno_headers = [];
                if(!annotations) {
                    var annoObj = {
                        headers: this.anno_headers,
                        annoMap: this.anno_mapping
                    }

                    this.store_setAnnoMapping(annoObj);
                    return;
                }

                annotations.forEach(a => {
                    var uni_mapping = JSON.parse(a);
                    var uniprotId = uni_mapping.uniprot_id;
                    var annotationsList = JSON.parse(uni_mapping.go_annotations);
                    this.anno_mapping[uniprotId] = annotationsList;
                    annotationsList.forEach(singleAnno => {
                        if(!this.anno_headers.includes(singleAnno.goName)) {
                           this.anno_headers.push(singleAnno.goName);
                       }
                    });
                });

                var annoObj = {
                    headers: this.anno_headers,
                    annoMap: this.anno_mapping
                }
                this.store_setAnnoMapping(annoObj);
            },
            processJson(treeJson) {
                d3.csv("/organism_to_display.csv", (err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        this.mappingData = data;
                        this.mapOrganismToDisplayName(treeJson);
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
            //For testing
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
            onTreeInit(nodes) {
                var tabularData = [];
                var sortedNodes = nodes.sort(function (a, b) {
                    return a.dfId - b.dfId;
                });
                var index = 0;
                let uniqueOrganisms = [];
                sortedNodes.forEach(n => {
                    if(!n.children) {
                        var tableNode = {};
                        tableNode["id"] = index++;
                        tableNode["Gene name"] = n.data.gene_symbol;
                        tableNode["Organism"] = n.data.organism;
                        var geneId = n.data.gene_id;
                        if (geneId) {
                            geneId = geneId.split(':')[1];
                        }
                        tableNode["Gene ID"] = geneId;
                        tableNode["Protein function"] = n.data.definition;
                        tableNode["Uniprot ID"] = n.data.uniprotId;

                        if(n.data.organism) {
                            let org = uniqueOrganisms.find(o => o.name === n.data.organism);
                            if(org) {
                                org.count++;
                            } else {
                                let org = {
                                    name: n.data.organism,
                                    count: 1
                                }
                                uniqueOrganisms.push(org);
                            }
                        }
                        tabularData.push(tableNode);
                    }
                });

                this.metadata.genesCount = tabularData.length;
                this.metadata.uniqueOrganisms.totalCount = uniqueOrganisms.length;
                uniqueOrganisms = _.sortBy( uniqueOrganisms, 'name' );
                this.metadata.uniqueOrganisms.organisms = uniqueOrganisms;

                this.completeData = tabularData;
            },
            onTreeUpdate(nodes) {
                this.metadata.isLoading = false;
                this.metadata.familyName = this.store_getTreeMetadata.familyName[0];
                this.metadata.spannedTaxon = this.store_getTreeMetadata.taxonRange;
                this.updateTableData(nodes);
            },
            expandAll() {
                this.$refs.treeLayout.onExpandAll();
            },
            showLegend() {
                this.$refs.treeLayout.onShowLegend();
                this.legend = !this.legend;
            },
            moveUp() {
                this.$refs.treeLayout.moveUp();
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
                        tableNode["Organism"] = n.data.organism;                       
                        this.anno_headers.sort(function (a, b) {
                            return a.toLowerCase().localeCompare(b.toLowerCase());
                        });
                        this.anno_headers.forEach(a => {
                            tableNode[a] = "";
                            if(n.data.uniprotId) {
                                let uniprotId = n.data.uniprotId.toLowerCase();
                                if(this.anno_mapping[uniprotId]) {
                                    let currAnno = this.anno_mapping[uniprotId];
                                    currAnno.forEach(c => {
                                        if(c.goName === a) {
                                            tableNode[a] = "*";
                                        }
                                    });
                                }
                            }
                        });
                        tableNode["Gene ID"] = geneId;
                        tableNode["Protein name"] = n.data.definition;
                        tableNode["Uniprot ID"] = n.data.uniprotId;
                        tableNode["Subfamily Name"] = n.data.sf_name;
                        tabularData.push(tableNode);
                    }
                });
                this.stateSetTreeData(tabularData);
            }
        },
        created() {
            this.treeId = this.$route.params.id;
        }
    }
</script>

<style scoped>
    #main > .row {
        min-height: 91vh;
    }
    .pg-databand {
        font-size: medium;
    }
    @media (min-height: 300px) {
        .pg-databand { font-size: small; }
    }
    @media (min-height: 768px) {
        .pg-databand { font-size: medium; }
    }
    .pg-panel {
        border-left: 1px solid;
        border-color: #fff !important;
        box-sizing: border-box;
        box-shadow: 0 0 4px 0 rgba(0,0,0,.1);
        padding: 15px;
        overflow: hidden;
    }
    @media (max-height: 948px) {
        .pg-panel { padding-top: 1px; }
    }
</style>