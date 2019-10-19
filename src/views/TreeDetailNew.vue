<template>
    <div id="main" class="container-fluid main_container d-flex">
        <div class="row flex-fill">
            <div class="col-sm-12 h-95 pg-panel">
                <div class="row h-50">
                    <div class="col-sm-12 h-50">
                        <table class="mainTable"> 
                            <thead id="head" ref="thead">
                                <tr id="mainTr">
                                    <th class="widthTree">First</th>
                                    <th v-for="(col,i) in colsToRender" :key="i"
                                        :class="getThClasses(col, i)"> 
                                        {{col}}
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="body" ref="tbody">
                                <tr>
                                    <td :rowspan="rowSpan" class="widthTree">
                                        <treelayout  :jsonData="treeData_Json" :heightFP="rowsHeight"
                                                     ref="treeLayout"
                                                     v-on:init-tree="onTreeInit"
                                                     v-on:updated-tree="onTreeUpdate"></treelayout>
                                    </td>
                                </tr>
                                <tr v-for="(row, row_i) in rowsToRender" :key=row_i>
                                    <td v-for="(key, i) in colsToRender" :key="i"
                                        :class="getTdClasses(key, row[key], i)">
                                            <tablecell :content.sync="rowsToRender[row_i][key]"></tablecell>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import treelayoutnew from '../components/tree/TreeLayout_new';
import treelayout from '../components/tree/TreeLayout';
import tablelayout from '../components/table/TableD3';
import intersect from '../components/tree/Intersection';
import searchBox from '../components/search/SearchBox';

import * as d3 from 'd3';
import axios from "axios/index";
import {mapActions} from 'vuex';
import {mapGetters} from 'vuex';
import { setTimeout } from 'timers';
import { Promise } from 'q';

import * as types from '../store/types_treedata';
import customModal from '@/components/modal/CustomModal';
import popupTableOrganism from '@/components/table/PopupTableOrganism';
import baseCell from '@/components/table/cells/BaseTableCell';

export default {
    name: "TreeDetailNew",
    components: {
        treelayout: treelayout,
        tablecell: baseCell,
    },
    data() {
        return {
            defaultCols: ["Gene name", 
                        "Organism",
                        "Gene ID", 
                        "Protein name", 
                        "Uniprot ID", 
                        "Subfamily Name"],
            colsToRender: [],
            rowsToRender: [],
            treeData_Json: null,
            treeId: null,
            rowSpan: 100,
            rowsHeight: 1000
        }
    },
    computed: {
        ...mapGetters({
            store_treeJsonString: types.TREE_GET_JSON,
            store_tableData: types.TABLE_GET_DATA,
            stateTreeAnnotations: types.TREE_GET_ANNOTATIONS,
            store_getTreeMetadata: types.TREE_GET_METADATA,
            store_treeMsaData: types.TREE_GET_MSADATA,
            store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
            store_tableIsLoading: types.TABLE_GET_ISTABLELOADING,
            store_maxMsaLength: types.TREE_GET_MAXMSAL
        }),
    },
    mounted() {
        // this.loadTreeFromApi();
        let i = 0;
        for(i = 0; i < 100; i++) {
            let processedRowData = {};
            this.colsToRender.forEach(c => {
                processedRowData[c] = "Test";
            });
            this.rowsToRender.push(processedRowData);
        }
    },
    watch: {
        '$route.params.id': {
            handler: function (id) {
                if(!id) return;
                this.initForNewTreeId(id);
            },
            deep: true,
            immediate: true
        },
        store_tableData: {
            handler: function (val, oldVal) {
                //This is zero, when a new tree is reloaded.
                // console.log("table ", val);
                // this.renderTable();
                if(val.length != 0) {
                    this.renderTable();
                }
            },
            immediate: true
        },
    },
    methods: {
        ...mapActions({
            store_setPantherTreeFromApi: types.TREE_ACTION_SET_PANTHER_TREE,
            store_setMsaFromApi: types.TREE_ACTION_SET_MSADATA,
            store_setMatchedNodes: types.TREE_ACTION_SET_MATCHED_NODES,
            store_setAnnoMapping: types.TREE_ACTION_SET_ANNO_MAPPING,
            store_setTableData: types.TABLE_ACTION_SET_DATA,
            stateTreeZoom: types.TREE_ACTION_SET_ZOOM,
            store_setSearchTxtWthn: types.TREE_ACTION_SET_SEARCHTEXTWTN,
            store_setTableIsLoading: types.TABLE_ACTION_SET_TABLE_ISLOADING,
            store_setFreqMsa: types.TABLE_ACTION_SET_MSA_FREQ
        }),
        initForNewTreeId(id) {
            this.treeId = id;
            this.treeData_Json = null;
            this.loadTreeFromApi();
            this.store_setTableData([]);
            // this.metadata.isLoading = true;
            // this.showMsa = false;
            // this.analyzeCompleted = false;
            // this.resetPruning();
        },
        //Load tree data needed from the API.
        loadTreeFromApi() {
            //Saves the panther tree in json String onto the vue store.
            var p1 = this.store_setPantherTreeFromApi(this.treeId);
            var p2 = this.store_setMsaFromApi(this.treeId);
            Promise.all([p1, p2]).then(vals => {
                if(vals.length > 1) {
                    // this.resetPruning();
                    this.initTreeData(this.store_treeJsonString);
                }
            });
        },
        // Set tree data which is sent to TreeLayout as a prop called 'jsonData'
        initTreeData(jsonString) {
            var treeJson = JSON.parse(jsonString);
            treeJson = treeJson.search.annotation_node;
            this.formatJson(treeJson);
            this.processJson(treeJson)
                .then(res => {
                    this.treeData_Json = res;
                })
                .catch(e => {
                    console.error("Process json failed! ", e);
                });
            // this.completeData = null;
        },
        getMappingFromCsv(fileName) {
            return new Promise((resolve, reject) => {
                d3.csv(fileName, function(error, data) {
                    if(error) {
                        reject(error);
                    } else {
                        resolve(data);
                    }
                });
            });
        },
        // Process json with external mappings (if any) by adding more fields
        // Current external mapping: organism_to_display.csv, to map common name to organism
        async processJson(treeJson) {
            //Since 'getMappingFromCsv' is an asynchronous call, we use await, which stops execution until the function
            // returns data
            const mappingCsvData = await this.getMappingFromCsv("/organism_to_display.csv");
            this.mappingData = mappingCsvData;
            this.addFieldsToAllNodes(treeJson);
            return treeJson;
        },
        //Recursive - Format each node inside the tree structure
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
        //Recursive
        // Fields currently being added: 'sequence', 'displayName', 'taxonId', 'text', 'fillColor', 
        addFieldsToAllNodes(node) {
            //Set 'displayName' and 'taxonId' from this.mappingData
            if(node.organism) {
                var found_mapping = this.mappingData.find(o => o.Organism.toLowerCase() === node.organism.toLowerCase());
                if(found_mapping) {
                    node.displayName = found_mapping.displayName.trim();
                    node.taxonId = found_mapping.taxonID;
                }
            }
            //Set 'text' for each node if present
            let text = this.getText(node);
            if (text != null) {
                node.text = text;
            }
            //Set 'fillColor' for each node
            let fillColor = this.getNodeColor(node);
            if(fillColor) {
                node.fillColor = fillColor;
            }
            //Set 'sequence' from this.store_treeMsaData
            let accessionId = node.accession;
            if(accessionId) {
                let sequence = this.store_treeMsaData.get(accessionId);
                if(sequence) {
                    node.sequence = sequence;
                }
            }
            if(node.children) {
                node.children.forEach(d => {
                    this.addFieldsToAllNodes(d);
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

        ///////After Tree loaded
        onTreeInit(nodes) {

            var tabularData = [];
            this.sortArrayByX(nodes);
            var index = 0;
            let uniqueOrganisms = [];
            nodes.forEach(n => {
                if(!n.children && n.data.uniprotId) {
                    var tableNode = {};
                    tableNode["id"] = index++;
                    tableNode["MSA"] = n.data.sequence;
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

                    tableNode["MSA"] = n.data.sequence;
                    tabularData.push(tableNode);
                }
            });
            this.store_setTableData(tabularData);
            this.store_setTableIsLoading(false);
        },
        onTreeUpdate(nodes) {
            console.log("update ", nodes.length);
            var tabularData = [];
            this.sortArrayByX(nodes);
            var index = 0;
            let uniqueOrganisms = [];
            nodes.forEach(n => {
                if(!n.children) {
                    var tableNode = {};
                    tableNode["id"] = index++;
                    tableNode["MSA"] = n.data.sequence;
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

                    tableNode["MSA"] = n.data.sequence;
                    tabularData.push(tableNode);
                }
            });
            console.log("Table length ", tabularData.length);
            this.store_setTableData(tabularData);
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
        ////////////////////// TABLE ///////////////////////////////
        renderTable() {
            if(this.store_tableData != null && this.store_tableData.length > 0) {
                // this.isLoading = false;
                this.update();
            }
        },
        update() {
            var filteredCols = d3.keys(this.store_tableData[0]);
            filteredCols = filteredCols.filter(t => this.defaultCols.includes(t));
            this.colsToRender = filteredCols;
            this.rowsToRender = [];
            this.displayRows();
            this.rowSpan = this.rowsToRender.length+1;
            this.rowsHeight = this.rowsToRender.length*40;
        },
        displayRows() {
            this.store_tableData.forEach(n => {
                let processedRowData = this.processRow(n);
                this.rowsToRender.push(processedRowData);
            });
        },
        processRow(rowData) {
            let row = {};
            this.colsToRender.forEach(c => {
                let cellTxt = rowData[c];
                let content = {text: cellTxt, id: rowData.id};
                row[c] = content;
            });
            return row;
        },
        getThClasses(row, i) {
            let classes = [];
            classes.push('widthDefault');
            return classes;
        },
        getTdClasses(row, cellValue, col_idx) {
            let classes = [];
            if(row == "MSA") {
                classes.push('widthMax');
            } else {
                classes.push('widthDefault');
            }

            return classes;
        },
    }
}
</script>

<style scoped>
.mainTable {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    overflow: hidden;
    font-size: 14px;
    font-family: sans-serif;
    border-bottom: 5px solid #f1f1f0;
}
.mainTable thead {
    flex: 0 0 auto;
    display: block;
    /* required for programmatic scrolling of header */
    overflow-x: hidden;
    overflow-y: scroll;
}
.mainTable td {
    height: 40px !important;
}
.mainTable th {
    text-align: center;
    border-top: 3px solid #f1f1f0;
}
.mainTable th, .mainTable td {
    border-right: 3px solid #f1f1f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 1;
}
.mainTable tbody {
    overflow: scroll;
}
.mainTable tr:nth-child(even) td:first-child {
    background-color: #cdeaf5;
}
.mainTable tr:nth-child(odd) td:first-child {
    background-color: #e9e9e9;
}
#mainTr {
    border-bottom: 3px solid #f1f1f0;
    filter: brightness(100%) !important;
    cursor: default !important;
    background-color: #9cd5e3;
    height: 40px !important;
}
.widthTree {
    min-width: 700px;
    width: 700px;
    max-width: 700px;
}
.widthDefault {
    min-width: 200px;
    width: 200px;
    max-width: 200px;
}
.pg-panel {
    border-left: 1px solid;
    border-color: #fff !important;
    box-sizing: border-box;
    box-shadow: 0 0 4px 0 rgba(0,0,0,.1);
    padding: 15px;
}
</style>


