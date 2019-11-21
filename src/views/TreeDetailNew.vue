<template>
    <div id="main" class="container-fluid main_container d-flex">
        <div class="row flex-fill">
            <div class="col-sm-12 h-95 pg-panel">
                <div class="row h-50">
                    <div class="col-sm-12 h-50">
                        <tablelayout ref="tableLayout"
                            :colsFromProp="tableColsToRender" :headerMap="headerMap" :treeDataFromProp ="treeData_Json"
                            v-on:toggle-cols="toggleMsa" 
                            v-on:complete-data="onCompleteData"
                            v-on:anno-click="onAnnoClick">
                        </tablelayout>
                        <!-- <table class="mainTable"> 
                            <thead id="head" ref="thead">
                                <button v-if="msaTab" class="btn bg-white float-right msalegend" @click="toggleLegend">
                                    <span class="text-danger">{{showMsaLegend?"Hide Legend":"Show Legend"}}</span>
                                </button>
                                <tr id="secTr">
                                    <th class="widthTree"></th>
                                </tr>
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
                        </table> -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import treelayoutnew from '../components/tree/TreeLayout_new';
import treelayout from '../components/tree/TreeLayout';
import tablelayout from '../components/table/TableD3New';
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
        tablelayout: tablelayout,
        treelayout: treelayout,
        tablecell: baseCell,
    },
    data() {
        return {
            defaultCols: ["Gene",
                              "Organism", 
                              "Annotations",
                              "Gene name", 
                              "Gene ID", 
                              "Protein function", 
                              "Uniprot ID", 
                              "Subfamily Name"],
            msaCols: ["Gene name",
                        "MSA"],
            showMsa: false,
            analyzeCompleted: false,
            headerMap: {},
            completeData: null,
            tableColsToRender: [],
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
            store_annoMapping: types.TREE_GET_ANNO_MAPPING,
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
        // for(i = 0; i < 100; i++) {
        //     let processedRowData = {};
        //     this.colsToRender.forEach(c => {
        //         processedRowData[c] = "Test";
        //     });
        //     this.rowsToRender.push(processedRowData);
        // }
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
        stateTreeAnnotations: {
            handler: function (val, oldVal) {
                // console.log("tree ", val);
                this.loadAnnotations(val);
            },
            deep: true,
            immediate: true
        },
        store_annoMapping: {
            handler: function (val, oldVal) {
                // this.extraCols = val.headers;
                // console.log("Watch anno ", val.headers);
            },
            deep: true,
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
            this.setTableCols();
            // this.completeData = null;
        },
        loadAnnotations(annotations) {
            this.anno_mapping = {};
            this.anno_headers = [];
            this.go_mapping = {};
            // console.log("annotations ", annotations);
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
                    if(!(singleAnno.goName in this.go_mapping)) {
                        this.go_mapping[singleAnno.goName] = singleAnno.goId;
                    }
                });
            });

            var annoObj = {
                headers: this.anno_headers,
                annoMap: this.anno_mapping
            }
            this.store_setAnnoMapping(annoObj);
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
        /////////////////////// Anno ///////////////////////////////
        onAnnoClick(data) {
            let uniprotId = data.row["Uniprot ID"].text;
            if(uniprotId) {
                uniprotId = uniprotId.toLowerCase();
            } else {
                uniprotId = "N/A";
            }
            let uniHeader = "Uniprot ID: " + uniprotId.toUpperCase();
            let annoList = this.getFormattedAnnotationsList(uniprotId);
            annoList = annoList.filter(a => a.goTerm === data.val);
            if(annoList.length != 0) {
                this.$refs.tableLayout.displayPopup(uniHeader, annoList);
            }
        },
        getFormattedAnnotationsList(uniprotId) {
            var annosForGene = this.store_annoMapping.annoMap[uniprotId];
            var annoList = [];
            if(!annosForGene) return annoList;
            annosForGene.forEach(a => {
                let id = a.goId;
                let goTermLink = "https://www.ebi.ac.uk/QuickGO/term/"+id;
                var code = "";
                if(a.evidenceCode) {
                    code = a.evidenceCode.split(",")[2];
                }
                var refCode = a.reference.split(":")[0];
                var refId = a.reference.split(":")[1];
                var refLink = "https://www.ncbi.nlm.nih.gov/pubmed/" + refId;
                if(refCode == "GO_REF") {
                    refLink = "https://github.com/geneontology/go-site/blob/master/metadata/gorefs/goref-"
                        +refId+".md";
                }
                let withFromList = [];
                if(a.withFrom) {
                    a.withFrom.forEach(r => {
                        withFromList.push(
                            {name: r.db+":"+r.id,
                                link: this.getDBLink(r)
                            });
                    });
                }

                var findGoId = annoList.find(a => {
                    if(refCode != '') {
                        return a.goId === id && a.code === code;
                    } else {
                        return a.goId === id
                    }
                });
                if(!findGoId) {
                    annoList.push({
                        goId: a.goId,
                        goTerm: a.goName,
                        goTermLink: goTermLink,
                        code: code,
                        reference: [{
                            count: 1,
                            link: refLink
                        }],
                        withFrom: withFromList,
                        source: "QuickGO",
                        sourceLink: "https://www.ebi.ac.uk/QuickGO/annotations?geneProductId=" + uniprotId
                    });
                } else {
                    let refLinksList = findGoId.reference.map(r => {
                        return r.link;
                    });

                    if(!refLinksList.includes(refLink)) {
                        findGoId.reference.push({
                            count: findGoId.reference.length + 1,
                            link: refLink
                        });
                        findGoId.withFrom.concat(withFromList);
                    }
                }
            });
            return annoList;
        },
        /////////////////////// MSA ///////////////////////////////
        toggleMsa() {
            this.showMsa = !this.showMsa;
            if(!this.analyzeCompleted) {
                this.analyzeAndShowMsa();
            } else {
                this.setTableCols();
            }
        },
        onCompleteData(data) {
            this.completeData = data;
        },
        //Analyze Msa Data and set table cols to msa.
        analyzeAndShowMsa() {
            this.analyzeMsaData().then(res => {
                this.headerMap["MSA"] = this.setMsaHeaderTitle();
                this.setTableCols();
                this.analyzeCompleted = true;
            });
        },
        async analyzeMsaData() {
            let msa_split = [];
            // Each seq of every node of tree (completeData) is split by letters and 
            // added as an array of letters.
            // Each array of letters is of the same length.
            // eg. [0]=['.','.','m','f']
            //     [1]=['.','.','n','g'] 
            this.completeData.forEach(s => {
                let msa_arr = [];
                if(s["MSA"]) {
                    msa_arr = s["MSA"].split('');
                }
                msa_split.push(msa_arr);
            });
            let maxLength = msa_split[0].length;

            /* Each index in the array consists of a 'seqObj' which gives freq of unique letters
            found in that index inside the 'msa_split' array.
            If 'msa_split' is following:
                [0] = ['a','b','b','a','e']
                [1] = ['b','b','a','a','e']
                [2] = ['a','b','a','a','c']
            Then 'analysis_arr' after the initial processing is:
                [0] = {'a': 2, 'b': 1}
                [1] = {'b': 3}
                [2] = {'b': 1, 'a':2}
                [3] = ['a': 3]
                [4] = ['e': 2, 'c': 1]
            */
            let analysis_arr = new Array(maxLength).fill({});
            let ix = 0;
            msa_split.forEach(seq_arr => {
                let node_index = 0;
                seq_arr.forEach(letter => {
                    let seqObj = {};
                    //Assign is used to clone the current object inside the 'analysis_arr' at the curr index.
                    //We need the prev node_index 'seqObj' to increment the letters if duplicate or add a new letter.
                    Object.assign(seqObj, analysis_arr[node_index]);
                    if(letter) {
                        if(seqObj[letter]) {
                            seqObj[letter]++;
                        } else {
                            seqObj[letter] = 1;
                        }
                    }
                    
                    analysis_arr[node_index] = seqObj;
                    node_index++;
                });
                ix++;
            });

            //After the analysis is done, create 'freq_seq_arr' which gives
            // highest frequence letter at each node index along with it's percent.
            // Eg. [0] = {l: 'a', p:80}
            //     [1] = {l: 'b', p:30} ...
            // 'freq_seq_arr' could be a map [l]:{p}, but kept as an array incase in future we 
            // need to add percent for second-highest letter for instance.
            let freq_seq_arr = [];
            let i =0;
            analysis_arr.forEach(e => {
                let arr = this.calculateFreqByPercent(e).slice(0,1);
                let f = parseFloat(arr[0].percent);
                f = f.toFixed(2);
                let obj = {l: arr[0].letter, p: f, i: i++};
                freq_seq_arr.push(obj);
            });
            let filtered = freq_seq_arr.filter((f, i) => {
                return f.l != '.' && f.l != '-' && f.p >= 50
            });
            
            this.store_setFreqMsa(freq_seq_arr);
            return true;
        },
        //freqOfLetters: {'a':2, 'b':1, 'c':3 ... etc}
        //Calculates the percent of each letter from the total freq of all letters.
        //Creates a new array: ['letter', 'freq', 'percent']
        //Sorts the new array by percent and returns the arr. 
        calculateFreqByPercent(freqOfLetters) {
            let seqObjArr = [];
            let letters = Object.keys(freqOfLetters);
            let total = 0;
            letters.forEach(l => {
                let freq = freqOfLetters[l];
                seqObjArr.push({letter: l, freq: freq});
                total += freq;
            });

            seqObjArr.map(e => {
                e.percent = e.freq/total*100;
            });
            seqObjArr = seqObjArr.sort((a,b) => {
                return b.percent - a.percent;
            });
            return seqObjArr;
        },
        setMsaHeaderTitle() {
            let msa_header = "MSA:";
            let max_ruler_len = this.store_maxMsaLength;
            let ruler_gap = 25;
            let c = msa_header.length+1;
            let digits = 2;
            let markedCount = 0;
            while(c < max_ruler_len) {
                if((c+digits)%ruler_gap == 0) {
                    msa_header += c+digits;
                    msa_header += "|";
                    c += digits;
                    //Check if c for next ruler mark is supposed to inc digits count
                    if(c+ruler_gap > 99) digits=3;
                    if(c+ruler_gap > 999) digits=4;
                } else {
                    msa_header += "&nbsp";
                }
                c++;  
            }
            return msa_header;
        },
        ///////////////////////

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
        setTableCols() {
            // this.tableColsToRender = this.defaultCols;
            if(this.showMsa) {
                this.tableColsToRender = this.msaCols;
            } else {
                this.tableColsToRender = this.defaultCols;
            }
            setTimeout(() => {
                this.$refs.tableLayout.updateRenderRows();
            });
        },
        renderTable() {
            if(this.store_tableData != null && this.store_tableData.length > 0) {
                // this.isLoading = false;
                this.update();
            }
        },
        update() {
            // var filteredCols = d3.keys(this.store_tableData[0]);
            // filteredCols = filteredCols.filter(t => this.defaultCols.includes(t));
            // if(this.defaultCols.includes("Annotations")) {
            //     console.log("Anno mapping");
            //     this.store_annoMapping.headers.forEach(h => {
            //         console.log(h);
            //         filteredCols.splice(2, 0, h);
            //     });
            // }
            // this.colsToRender = filteredCols;
            // console.log(this.colsToRender);
            // this.rowsToRender = [];
            // this.displayRows();
            // this.rowSpan = this.rowsToRender.length+1;
            // this.rowsHeight = this.rowsToRender.length*40;
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
    width: 1600px;
    height: 1100px;
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
 #secTr {
    height: 53px !important;
    filter: brightness(100%) !important;
    border: 0 !important;
    background-color: transparent;
}
#secTr th {
    height: 35px !important;
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
::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 15px;
}
::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgb(0,0,0,0.5);
    -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.897);
    width: 70px;
}
</style>


