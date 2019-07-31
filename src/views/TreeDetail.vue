<template>
    <div id="main" class="container-fluid main_container d-flex">
        <modal v-if="showPopup" @close="showPopup = false">
            <div slot="header">{{popupHeader}}</div>
            <template slot="body" slot-scope="props">
                <popupTable v-if="popupData.length > 0" :data="popupData" :cols="popupCols"
                            v-on:check-change="onAnyCheckboxChange"
                            v-on:uncheck-all="onUncheckAll"
                            v-on:check-all="onCheckAll"></popupTable>
                <div v-if="popupData.length===0"><i>No Go Annotations for this gene!</i></div>
            </template>
            <template slot="footer"> 
                <button class="modal-default-button" @click="onPrune">
                    Update tree
                </button>
                <button class="modal-default-button" @click="showPopup = false">
                    Close
                </button>
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
                        {{metadata.uniqueOrganisms.totalCount}} Organisms<span v-if="this.prunedLoaded"> (pruned view)</span>
                        </u></b></span>, spanning {{this.metadata.spannedTaxon}}
                </span>
            </div>
            <!-- Tree Panel -->
            <div class="col-sm-6 h-95 pg-panel">
                <div class="row h-100">
                    <!-- Menu Bar -->
                    <div class="col-sm-12">
                        <div class="row align-items-center justify-content-between">
                            <div class="col-auto align-items-center">
                                <search-box ref="searchBox" 
                                            v-on:search="onSearch" :defaultText="defaultSearchText"></search-box>
                            </div>
                            <div class="col-auto align-items-center">
                                <b-dropdown v-b-tooltip.hover title="Operations" variant="white" class="bg-white" no-caret>
                                    <template slot="button-content">
                                        <i class="fas fa-tools fa-2x fa-fw"></i>
                                    </template>
                                    <b-dropdown-item @click="exportXML">Download tree as PhyloXML</b-dropdown-item>
                                    <!-- using vue-json-csv. reference: https://www.npmjs.com/package/vue-json-csv -->
                                    <json-csv 
                                        :data="tableCsvData" 
                                        :name="treeId+'.csv'" 
                                        :fields="tableCsvFields"
                                    >
                                        <b-dropdown-item>Download gene table as CSV</b-dropdown-item>
                                    </json-csv>
                                    <b-dropdown-item @click="exportPNG">Save tree image as PNG</b-dropdown-item>
                                    <b-dropdown-item @click="exportSVG">Save tree image as SVG</b-dropdown-item>
                                    <b-dropdown-item @click="pruneTreeFromMenu">Prune tree by organism</b-dropdown-item>
                                </b-dropdown>
                                <button v-b-tooltip.hover title="Compact View" class="btn bg-white" @click="onDefaultView">
                                    <i class="fas fa-compress-arrows-alt fa-2x fa-fw"></i></button>
                                <button v-b-tooltip.hover title="Expand All" class="btn bg-white"
                                            @click="expandAll"><i class="fas fa-expand-arrows-alt fa-2x fa-fw"></i></button>
                                <button @mouseover="showLegendTip=true" @mouseout="showLegendTip=false" class="btn bg-white"
                                        @click="showLegend" id="legendButton"><i :class="showLegendButtonIcon.buttonIcon + ' fa-2x  fa-fw'"></i>     
                                </button>
                                <b-tooltip :show.sync="showLegendTip" target="legendButton" placement="top">
                                    {{showLegendButtonIcon.title}}
                                </b-tooltip>
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
                                        v-on:get-table-csv-data="getTableCsvData"
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
    import axios from "axios/index";
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    import * as types from '../store/types_treedata';
    import customModal from '@/components/modal/CustomModal';
    import popupTableOrganism from '@/components/table/PopupTableOrganism';
import { setTimeout } from 'timers';

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
                store_getTreeMetadata: types.TREE_GET_METADATA,
                store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
                store_tableIsLoading: types.TABLE_GET_ISTABLELOADING,
            }),
            showLegendButtonIcon(){
                return this.legend?
                {
                    title: 'Hide Legend',
                    buttonIcon: 'fas fa-angle-double-up'
                }:
                {
                    title: 'Show Legend',
                    buttonIcon: 'fas fa-angle-double-down'
                };
            }
        },
        watch: {
            '$route.params.id': function (id) {
                this.treeId = id;
                this.jsonData = null;
                this.loadJsonFromDB(this.treeId);
                this.stateSetTreeData([]);
                this.metadata.isLoading = true;
                this.resetPruning();
            },
            stateTreeJson: {
                handler: function (val, oldVal) {
                    this.loadJson(val);
                    this.prunedLoaded = false;
                    this.resetPruning();
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
            },
            store_tableIsLoading: {
                handler: function(val, oldval) {
                    if(!val) {
                        if(this.store_getSearchTxtWthn != null) {
                            this.defaultSearchText = this.store_getSearchTxtWthn;
                            this.onSearch(this.store_getSearchTxtWthn);
                        } else {
                            this.defaultSearchText = "";
                            this.searchText = "";
                            this.matchNodes = [];
                            this.store_setMatchedNodes(null);
                        }
                    }
                }
            }
        },
        data() {
            return {
                showLegendTip: false,
                treeId: null,
                branchLength: "N/A",
                completeData: null,
                jsonData: null,
                mappingData: null,
                baseUrl: process.env.BASE_URL,
                phyloXML_URL: "https://phyloxml.s3-us-west-2.amazonaws.com/",
                searchText: "",
                defaultSearchText: "",
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
                popupHeader: "Organisms (uncheck an organism to remove from tree)",
                popupCols: [{type:'checkbox', val:true}, 
                            "Organism",
                            "Number of genes"],
                popupData: [],
                popupTableConfig: {
                    tableHeight: 'auto',
                    tableWidth: 'auto',
                    colsWidth: ['50px', '350px', '100px']
                },
                //Pruning
                PRUNING_PANTHER_API: "http://54.68.67.235:8080/panther/pruning/",
                prunedLoaded: false,
                unprunedTaxonIds: [],
                originalTaxonIdsLength: 0,
                tableCsvData: [],
                tableCsvFields:[
                    'Uniprot ID',
                    'Gene ID',
                    'Gene name',
                    'Organism',
                    'Protein function',
                    'Subfamily name'
                ],
            }
        },
        mounted() {
            this.resetPruning();
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
                store_setSearchTxtWthn: types.TREE_ACTION_SET_SEARCHTEXTWTN
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
            loadJsonFromFile(fileName) {
              d3.json("/sam_annotations_simple.json", (err, data) => {
                  if (err) {
                      console.error(err);
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
                        console.error(err);
                    } else {
                        this.mappingData = data;
                        this.mapOrganismToDisplayName(treeJson);
                        this.jsonData = treeJson;
                    }
                });
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
            mapOrganismToDisplayName(node) {
                //Set organism name from mapping data
                if(node.organism) {
                    var found_mapping = this.mappingData.find(o => o.Organism.toLowerCase() === node.organism.toLowerCase());
                    if(found_mapping) {
                        node.displayName = found_mapping.displayName.trim();
                        node.taxonId = found_mapping.taxonID;
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
                        } else if(d.taxonomic_range) {
                            text += d.taxonomic_range;
                        } else {
                            text += this.getLeafNodeText(d);
                        }
                    } else if(d.event_type === "SPECIATION") {
                        if (d.speciation_event) {
                            text += d.speciation_event;
                        } else if(d.taxonomic_range) {
                            text += d.taxonomic_range;
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
            //             console.error(err);
            //         } else {
            //             data = data.search.annotation_node;
            //             this.formatJson(data);
            //             this.setNodeColor(data);
            //
            //             //  assigns the data to a hierarchy using parent-child relationships
            //             var nodes = d3.hierarchy(data, function(d) {
            //                 return d.children;
            //             });
            //
            //             this.jsonData = data;
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
                this.sortArrayByX(nodes);
                var index = 0;
                let uniqueOrganisms = [];
                nodes.forEach(n => {
                    if(!n.children && n.data.uniprotId) {
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
                                    commonName: n.data.displayName,
                                    taxonId: n.data.taxonId,
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
                if(!this.prunedLoaded) {
                    uniqueOrganisms = _.sortBy( uniqueOrganisms, 'name' );
                    this.metadata.uniqueOrganisms.organisms = uniqueOrganisms;
                    this.originalTaxonIdsLength = this.metadata.uniqueOrganisms.totalCount;
                } 

                this.completeData = tabularData;           
            },
            onTreeUpdate(nodes) {
                this.metadata.isLoading = false;
                this.metadata.familyName = this.store_getTreeMetadata.familyName[0];
                this.metadata.spannedTaxon = this.store_getTreeMetadata.taxonRange;
                this.sortArrayByX(nodes);
                this.updateTableData(nodes);
            },
            expandAll() {
                this.$refs.treeLayout.onExpandAll();
            },
            onDefaultView() {
                this.$refs.treeLayout.onDefaultView();
                this.$refs.searchBox.onReset();
            },
            exportXML() {
                this.downloadXmlWithAxios();
            },
            getTableCsvData(nodes) {
                this.sortArrayByX(nodes);
                nodes.forEach(n => {
                    if(!n.children) {
                        var tableNode = {};
                        tableNode["Gene name"] = n.data.gene_symbol;
                        tableNode["Organism"] = n.data.organism;
                        var geneId = n.data.gene_id;
                        if (geneId) {
                            geneId = geneId.split(':')[1];
                        }
                        tableNode["Gene ID"] = geneId;
                        tableNode["Protein name"] = n.data.definition;
                        tableNode["Uniprot ID"] = n.data.uniprotId;
                        tableNode["Subfamily name"] = n.data.sf_name;
                        this.anno_headers.sort(function (a, b) {
                            return a.toLowerCase().localeCompare(b.toLowerCase());
                        });
                        this.anno_headers.forEach(a => {
                            this.tableCsvFields.push(a);
                            tableNode[a] = 0;
                            if(n.data.uniprotId) {
                                let uniprotId = n.data.uniprotId.toLowerCase();
                                if(this.anno_mapping[uniprotId]) {
                                    let currAnno = this.anno_mapping[uniprotId];
                                    currAnno.forEach(c => {
                                        if(c.goName === a) {
                                            tableNode[a] = 1;
                                        }
                                    });
                                }
                            }
                        });
                        this.tableCsvData.push(tableNode);
                    }
                });
                this.tableCsvData.forEach( node => {
                    node['Columns after \'Subfamily name\', if any, are \'Known functions\'. Each \'Known function\' is a GO molecular function term that is annotated to at least one member of the gene family AND that the annotation is supported by an experimental evidence. Number 1 or 0 indicates the presence or absence of a particular function in a gene.']=null;                        
                })
                this.tableCsvFields.push('Columns after \'Subfamily name\', if any, are \'Known functions\'. Each \'Known function\' is a GO molecular function term that is annotated to at least one member of the gene family AND that the annotation is supported by an experimental evidence. Number 1 or 0 indicates the presence or absence of a particular function in a gene.');
            },
            exportPNG() {
                this.$refs.treeLayout.onExportPng(this.treeId);
            },
            exportSVG() {
                this.$refs.treeLayout.onExportSvg(this.treeId);
            },
            showLegend() {
                this.$refs.treeLayout.onShowLegend();
                this.legend = !this.legend;
            },
            moveUp() {
                this.$refs.treeLayout.moveUp();
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
            downloadXmlWithAxios(){
                axios({
                    method: 'get',
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                    },
                    url: this.phyloXML_URL+this.treeId+".xml",
                    responseType: 'arraybuffer'
                })
                .then(response => {
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', this.treeId+'.xml'); //or any other extension
                    document.body.appendChild(link);
                    link.click();
                })
                .catch(() => console.error('error occured'))
            },
            // ~~~~~~~~~~~~~~~~ Tree Layout Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            updateTableData(nodes) {
                var tabularData = [];
                var index = 0;
                nodes.forEach(n => {
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
                        if(n._children) {
                            if(n.data.accession) {
                                tableNode["accession"] = n.data.accession;
                            }
                        }
                        tabularData.push(tableNode);
                    }
                });
                this.stateSetTreeData(tabularData);
            },
            // ~~~~~~~~~~~~~~~~ Pruning ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            pruneTreeFromMenu() {
                this.showOrganismPopup();
            },
            showOrganismPopup() {
                this.showPopup = true;
                this.popupData = [];
                this.popupCols[0].val = true;
                
                setTimeout(() => {
                    let anyUnchecked = this.popupData
                                            .map(pd => {return pd[0].checked;})
                                            .some(res => {return !res});
                    if(anyUnchecked) this.popupCols[0].val = false;
                });

                this.metadata.uniqueOrganisms.organisms.forEach(o => {
                    let singleRow = [];
                    let checkedV = true;
                    if(this.unprunedTaxonIds.length > 0 && 
                        !this.unprunedTaxonIds.includes(o.taxonId)) {
                        checkedV = false;
                    }
                    singleRow.push({type: "checkbox", label: "txt", checked: checkedV});
                    let organismDisplayName = o.name + " (" + o.commonName + ")";
                    singleRow.push({type: "text", val: organismDisplayName, id: o.taxonId});
                    singleRow.push(o.count);
                    this.popupData.push(singleRow);
                });
            },
            onUncheckAll() {
                this.popupData = this.popupData.map(pd => {
                    pd[0].checked = false;
                    return pd
                });
                let filteredOrganisms = this.popupData.filter(pd => {
                    return pd[0].checked == true;
                });
            },
            onCheckAll() {
                this.popupData = this.popupData.map(pd => {
                    pd[0].checked = true;
                    return pd
                });
                let filteredOrganisms = this.popupData.filter(pd => {
                    return pd[0].checked == true;
                });
            },
            onAnyCheckboxChange() {
                //Timeout required becauses the "change" event is emitted before the value of the checkbox is updated.
                //So we need to perform any logic after a frame
                setTimeout(() => {
                    let anyUnchecked = this.popupData
                                        .map(pd => {return pd[0].checked;})
                                        .some(res => {return !res});
                    if(anyUnchecked) {
                        this.popupCols[0].val = false;
                    } else {
                        this.popupCols[0].val = true;
                    }
                }); 
            },
            resetPruning() {
                this.unprunedTaxonIds = 0;
                this.prunedLoaded = false;
                this.showPopup = false;
            },
            pruneTree(taxonList) {
                if(!taxonList || taxonList.length == 0) {

                } else {
                    if(taxonList.length == this.originalTaxonIdsLength) {
                        this.resetPruning();
                        this.loadJsonFromDB(this.treeId);
                        this.popupData = [];
                    } else {
                        this.$refs.treeLayout.onPruneLoading(true);
                        axios({
                            method: 'POST',
                            url: this.PRUNING_PANTHER_API + this.treeId,
                            data: {
                                taxonIdsToShow: taxonList
                            }
                        })
                        .then(res => {
                            this.isLoading = false;
                            this.showPopup = false;
                            this.prunedLoaded = true;
                            let prunedJson = res.data;
                            this.loadPrunedJson(prunedJson);
                            this.$refs.treeLayout.onPruneLoading(false);
                        })
                        .catch(err => {
                            console.error("error");
                            this.isLoading = false;
                            this.resetPruning();
                            this.$refs.treeLayout.onPruneLoading(false);
                        });
                    }
                }
            },
            onPrune() {
                let filteredOrganisms = this.popupData.filter(pd => {
                    return pd[0].checked == true;
                });
                this.unprunedTaxonIds = filteredOrganisms.map(o => o[1].id);
                this.pruneTree(this.unprunedTaxonIds);
            },
            loadPrunedJson(treeJson) {
                treeJson = treeJson.search.annotation_node;
                this.formatJson(treeJson);
                this.processJson(treeJson);
            },
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
    }
    @media (max-height: 948px) {
        .pg-panel { padding-top: 1px; }
    }
</style>