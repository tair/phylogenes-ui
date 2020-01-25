<template>
    <div id="main" class="container-fluid main_container d-flex">
        <!-- Organisms/Pruning Popup -->
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
                <button v-if="!isHighlightPopup" class="modal-default-button" @click="onPrune">
                    Update tree
                </button>
                <button v-if="isHighlightPopup" class="modal-default-button" @click="onHighlight">
                    Highlight tree
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
            <!-- Table -->
            <!-- class="col-sm-12 h-95 pg-panel"> -->
            <div>
                <tablelayout ref="tableLayout"
                            :treeId="treeId" :colsFromProp="tableColsToRender" :headerMap="headerMap" :treeDataFromProp ="treeData_Json"
                            :csvTable="csvTable"
                            v-on:toggle-cols="toggleMsa" 
                            v-on:tree-init="onTreeInit"
                            v-on:anno-click="onAnnoClick"
                            v-on:search-tree="onSearchWithinTree"
                            v-on:export-xml="exportXML"
                            v-on:prune-from-menu="pruneTreeFromMenu"
                            v-on:highlight-tree="highlightTreeByOrg"
                            v-on:set-csv-data="setCsvTableData"
                            >
                </tablelayout>
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
        'modal': customModal,
        popupTable: popupTableOrganism,
    },
    computed: {
        ...mapGetters({
            store_treeJsonString: types.TREE_GET_JSON,
            store_treeJsonObj: types.TREE_GET_JSON_OBJ,
            stateTreeAnnotations: types.TREE_GET_ANNOTATIONS,
            store_annoMapping: types.TREE_GET_ANNO_MAPPING,
            store_getTreeMetadata: types.TREE_GET_METADATA,
            store_treeMsaData: types.TREE_GET_MSADATA,
            store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
            store_tableIsLoading: types.TABLE_GET_ISTABLELOADING,
            store_maxMsaLength: types.TREE_GET_MAXMSAL
        }),
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
        '$route.name': {
            handler: function (val, oldVal) {
                if(val && val == "treeGrafted") {
                    this.loadTreeFromStore();
                }
            },
            immediate: true
        },
        store_getTreeMetadata: {
            handler: function (val, oldVal) {
                this.metadata.familyName = val.familyName[0];
                this.metadata.spannedTaxon = val.taxonRange;
                this.metadata.isLoading = false;
            }
        },
        stateTreeAnnotations: {
            handler: function (val, oldVal) {
                this.loadAnnotations(val);
            },
            deep: true,
            immediate: true
        },
        store_annoMapping: {
            handler: function (val, oldVal) {

            },
            deep: true,
            immediate: true
        },
        store_getSearchTxtWthn: {
            handler: function (val, oldVal) {
                if(val != null) {
                }
            },
            deep: true,
            immediate: true
        }
    },
    data() {
        return {
            REG_PRUNING_PANTHER_API: process.env.VUE_APP_TOMCAT_URL + '/panther/pruning/',
            GRAFT_PRUNING_PANTHER_API: process.env.VUE_APP_TOMCAT_URL + '/panther/grafting/prune',
            phyloXML_URL: process.env.VUE_APP_S3_URL,
            defaultCols: ["Gene",
                            "Organism", 
                            "Annotations",
                            "Gene name", 
                            "Gene ID", 
                            "Protein name", 
                            "Uniprot ID", 
                            "Subfamily Name"],
            msaCols: ["Gene",
                      "MSA"],
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
            matchNodes: [],
            //Popup
            showPopup: false,
            isHighlightPopup: false,
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
            prunedLoaded: false,
            unprunedTaxonIds: [],
            unhighlightedTaxonIds: [],
            originalTaxonIdsLength: 0,
            //Table CSV
            csvTable: {
                tableCsvData: [],
                tableCsvFields:[
                    'Uniprot ID',
                    'Gene',
                    'Gene ID',
                    'Gene name',
                    'Organism',
                    'Protein function',
                    'Subfamily name'
                ]
            },
            //MSA
            showMsa: false,
            analyzeCompleted: false,
            headerMap: {},
            completeData: null,
            tableColsToRender: [],
            treeData_Json: null,
            treeId: null
        }
    },
    mounted() {
        this.prunedLoaded= false;
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
            store_setFreqMsa: types.TABLE_ACTION_SET_MSA_FREQ,
            store_setHasGrafted: types.TREE_ACTION_SET_ISGRAFTED,
        }),
        initForNewTreeId(id) {
            this.treeId = id;
            this.treeData_Json = null;
            this.loadTreeFromApi();
            this.store_setTableData([]);
            this.metadata.isLoading = true;
            this.prunedLoaded= false;
            this.showMsa = false;
            this.analyzeCompleted = false;
            this.resetPruning();
        },
        //Load tree data needed from the API.
        loadTreeFromApi() {
            //Saves the panther tree in json String onto the vue store.
            var p1 = this.store_setPantherTreeFromApi(this.treeId);
            var p2 = this.store_setMsaFromApi(this.treeId);
            Promise.all([p1, p2]).then(vals => {
                if(vals.length > 1) {
                    var treeJson = JSON.parse(this.store_treeJsonString);
                    this.initTreeData(treeJson);
                }
            });
        },
        loadTreeFromStore() {
            //Reset
            this.resetPruning();
            this.showMsa = false;
            this.treeData_Json = null;
            this.analyzeCompleted = false;

            //For a grafted tree, we load the tree json from the store.
            var treeJson = this.store_treeJsonObj;
            if(treeJson.search) {
                //Get treeId from the json obj, and use it to get GO annotations and MSA data from the solr server.
                //The MSA will be empty for the extra grafted node.
                this.treeId = treeJson.search.book;
                var p1 = this.store_setPantherTreeFromApi(this.treeId);
                var p2 = this.store_setMsaFromApi(this.treeId);
                Promise.all([p1, p2]).then(vals => {
                    console.log("Loaded GO and MSA data from API");
                    this.treeId = treeJson.search.book;
                    this.metadata.isLoading = false;
                    this.initTreeData(treeJson);
                });
                this.store_setHasGrafted(true);
            }
        },
        // Set tree data which is sent to TreeLayout as a prop called 'jsonData'
        initTreeData(treeJson) {
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
                 if(accessionId == "ANGRAFTED") {
                        console.log("grafted ");
                        node.newGrafted = true;
                        node.text = "Grafted";
                    }
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
                    if(geneId) {
                        geneId = geneId.split(":")[1];
                    }
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
        //////////////////// Tree Menu Events /////////////////////////
        exportXML() {
            this.downloadXmlWithAxios();
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
            .catch((e) => console.error('error occured ', e))
        },
        ////////////////////// Metadata ////////////////////////////
        //Set metadata bar and organisms for pruning popup
        setMetadata(tabularData, uniqueOrganisms) {
            if(this.store_getTreeMetadata) {
                this.metadata.familyName = this.store_getTreeMetadata.familyName[0];
                this.metadata.spannedTaxon = this.store_getTreeMetadata.taxonRange;
            }
            this.metadata.genesCount = tabularData.length;
            this.metadata.uniqueOrganisms.totalCount = uniqueOrganisms.length;
            if(!this.prunedLoaded) {
                uniqueOrganisms = _.sortBy( uniqueOrganisms, 'name' );
                this.metadata.uniqueOrganisms.organisms = uniqueOrganisms;
                this.originalTaxonIdsLength = this.metadata.uniqueOrganisms.totalCount;
            }
            this.metadata.isLoading = false;
        },
        /////////////////////// Tree search from within ////////////
        onSearchWithinTree(text) {
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
                    //If search text is "grafted" then we check if any nodes is a grafted node and return it as a matched node.
                    // For getting grafted node, we check id accession is 'ANGRAFTED'
                    var grafted = false;
                    if(t["accession"] && t["accession"] == 'ANGRAFTED') {
                        if(text == "grafted") {
                            grafted = true
                        }
                    }
                    text = text.toLowerCase();

                    return geneName === text || geneId === text || uniprotId === text || grafted;
                });
                this.matchNodes = d;
            } else {
                this.matchNodes = [];
            }
            this.store_setMatchedNodes(this.matchNodes);
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
        getDBLink(r) {
            let link = "";
            switch(r.db){
                case 'UniProtKB':
                    link =  'https://www.uniprot.org/uniprot/'+r.id;
                    break;
                case 'AGI_LocusCode':
                    link =  'https://www.arabidopsis.org/servlets/TairObject?type=locus&name='+r.id;
                    break;
                case 'ComplexPortal':
                    link = 'https://www.ebi.ac.uk/complexportal/complex/'+r.id;
                    break;
                case 'EMBL':
                    link = 'https://www.ebi.ac.uk/cgi-bin/emblfetch?style=html&Submit=Go&id='+r.id;
                    break;
                case 'EcoGene':
                    link = 'http://www.ecogene.org/geneInfo.php?eg_id='+r.id;
                    break;
                case 'FB':
                    link = 'http://flybase.org/reports/'+r.id;
                    break;
                case 'GeneDB':
                    link = 'http://www.genedb.org/gene/'+r.id;
                    break;
                case 'NCBI_gi':
                    link = 'https://www.ncbi.nlm.nih.gov/protein/'+r.id;
                    break;
                case 'PomBase':
                    link = 'https://www.pombase.org/gene/'+r.id;
                    break;
                case 'RGD':
                    link = 'https://rgd.mcw.edu/rgdweb/report/gene/main.html?id='+r.id;
                    break;
                case 'RefSeq':
                    link = 'https://www.ncbi.nlm.nih.gov/nuccore/'+r.id;
                    break;
                case 'SGD':
                    link = 'https://www.yeastgenome.org/locus/'+r.id;
                    break;
                case 'TAIR':
                    link = 'https://www.arabidopsis.org/servlets/TairObject?accession='+r.id;
                    break;
                case 'WB':
                    link = 'https://wormbase.org/db/gene/gene?name='+r.id;
                    break;
                case 'ZFIN':
                    link = 'http://zfin.org/'+r.id;
                    break;
                case 'dictyBase':
                    link = ' http://dictybase.org/gene/'+r.id;
                    break;
                default:
                    console.log("DB Id not recognized:", r)
                    break;
            }
            return link;
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
        onTreeInit(msg) {
            this.completeData = msg.tabularData;
            this.setMetadata(msg.tabularData, msg.uniqueOrganisms);
        },
        //Analyze Msa Data and set table cols to msa.
        analyzeAndShowMsa() {
            this.store_setTableIsLoading(true);
            setTimeout(() => {
                this.analyzeMsaData().then(res => {
                    this.headerMap["MSA"] = this.setMsaHeaderTitle();
                    this.setTableCols();
                    this.analyzeCompleted = true;
                    this.store_setTableIsLoading(false);
                });
            }, 100);
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
        ///////////////////////

        ////////////////////// TABLE ///////////////////////////////
        setTableCols() {
            if(this.showMsa) {
                this.tableColsToRender = this.msaCols;
            } else {
                this.tableColsToRender = this.defaultCols;
            }
            setTimeout(() => {
                this.$refs.tableLayout.updateRenderRows();
            });
        },

        // ~~~~~~~~~~~~~~~~ Pruning ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
        //Reset all pruning global vars
        resetPruning() {
            this.unprunedTaxonIds = [];
            this.unhighlightedTaxonIds = [];
            this.prunedLoaded = false;
            this.showPopup = false;
            this.popupData = [];
        },
        pruneTreeFromMenu() {
            this.showOrganismPopup(false);
        },
        highlightTreeByOrg() {
            this.showOrganismPopup(true);
        },
        showOrganismPopup(highlightPopup) {
            this.isHighlightPopup = highlightPopup;
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
                if(!this.isHighlightPopup) {
                    if(this.unprunedTaxonIds.length > 0 && 
                        !this.unprunedTaxonIds.includes(o.taxonId)) {
                        checkedV = false;
                    }
                } else {
                    if(this.unhighlightedTaxonIds.length > 0 && 
                        !this.unhighlightedTaxonIds.includes(o.taxonId)) {
                        checkedV = false;
                    }
                }
                
                singleRow.push({type: "checkbox", label: "txt", checked: checkedV});
                let organismDisplayName = o.name + " (" + o.commonName + ")";
                singleRow.push({type: "text", val: organismDisplayName, id: o.taxonId, name: o.name});
                singleRow.push(o.count);
                this.popupData.push(singleRow);
                if(highlightPopup) {
                    this.popupHeader = "Organisms (select an organism to highlight it's genes on tree)"
                } else {
                    this.popupHeader = "Organisms (uncheck an organism to remove from tree)";
                }
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
        onHighlight() {
            let filteredOrganisms = this.popupData.filter(pd => {
                return pd[0].checked == true;
            });
            this.unhighlightedTaxonIds = filteredOrganisms.map(o => o[1].id);
            let searchOrgNames = [];
            searchOrgNames = filteredOrganisms.map(f => {
                return f[1].name;
            });
            var d = this.completeData.filter(t => {
                if(t["Organism"] != null && typeof t["Organism"] != 'number') {
                    for(var i=0; i<searchOrgNames.length; i++) {
                        if(t["Organism"] == searchOrgNames[i]) {
                            return true;
                        }
                    }
                }
                return false;
            });
            this.matchNodes = d;
            this.store_setMatchedNodes(this.matchNodes);
            this.showPopup = false;
        },
        onPrune() {
            let filteredOrganisms = this.popupData.filter(pd => {
                return pd[0].checked == true;
            });
            this.unprunedTaxonIds = filteredOrganisms.map(o => o[1].id);
            this.pruneTree(this.unprunedTaxonIds);
        },
        pruneTree(taxonList) {
            if(!taxonList || taxonList.length == 0) {

            } else {
                if(taxonList.length == this.originalTaxonIdsLength) {
                    this.resetPruning();
                    if(this.$route.name == "treeGrafted") {
                        this.loadTreeFromStore();
                    } else {
                        this.loadTreeFromApi();
                    }
                    this.popupData = [];
                } else {
                    this.$refs.tableLayout.onPruneLoading(true);
                    if(!this.store_getHasGrafted) {
                        this.regularPruning(taxonList)
                    } else {
                        this.graftedPruning(taxonList);
                    }
                }
            }
        },
        graftedPruning(taxonList) {
            let api =  this.GRAFT_PRUNING_PANTHER_API;
            let stored_seq = this.store_getGraftSeq;
            axios({
                method: 'POST',
                url: api,
                data: {
                    sequence: stored_seq,
                    taxonIdsToShow: taxonList
                },
                timeout: 200000
            })
            .then(res => {
                this.isLoading = false;
                this.showPopup = false;
                this.prunedLoaded = true;
                let prunedJson = res.data;
                this.analyzeCompleted = false;
                this.loadPrunedJson(prunedJson);
                this.$refs.tableLayout.onPruneLoading(false);
            })
            .catch(err => {
                console.error("error ", err);
                this.isLoading = false;
                this.resetPruning();
                this.$refs.tableLayout.onPruneLoading(false);
            });
        },
        regularPruning(taxonList) {
            axios({
                method: 'POST',
                url: this.REG_PRUNING_PANTHER_API + this.treeId,
                data: {
                    taxonIdsToShow: taxonList
                },
                timeout: 200000
            })
            .then(res => {
                this.isLoading = false;
                this.showPopup = false;
                this.prunedLoaded = true;
                let prunedJson = res.data;
                this.loadPrunedJson(prunedJson);
                this.$refs.tableLayout.onPruneLoading(false);
            })
            .catch(err => {
                console.error("error ", err);
                this.isLoading = false;
                this.resetPruning();
                this.$refs.tableLayout.onPruneLoading(false);
            });
        },
        loadPrunedJson(treeJson) {
            treeJson = treeJson.search.annotation_node;
            this.formatJson(treeJson);
            this.processJson(treeJson)
                .then(res => {
                    this.treeData_Json = res;
                })
                .catch(e => {
                    console.error("Process json failed!");
                });
        },
        // ~~~~~~~~~~~~~ Download csv ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
        setCsvTableData(nodes) {
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
                    tableNode["Gene"] = n.data.gene_symbol ? n.data.gene_symbol: geneId;
                    tableNode["Protein name"] = n.data.definition;
                    tableNode["Uniprot ID"] = n.data.uniprotId;
                    tableNode["Subfamily name"] = n.data.sf_name;
                    this.anno_headers.sort(function (a, b) {
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    });
                    this.anno_headers.forEach(a => {
                        const goNameHeader = `${a} (${this.go_mapping[a]})`;
                        this.csvTable.tableCsvFields.push(goNameHeader);
                        tableNode[goNameHeader] = 0;
                        if(n.data.uniprotId) {
                            let uniprotId = n.data.uniprotId.toLowerCase();
                            if(this.anno_mapping[uniprotId]) {
                                let currAnno = this.anno_mapping[uniprotId];
                                currAnno.forEach(c => {
                                    if(c.goName === a) {
                                        tableNode[goNameHeader] = 1;
                                    }
                                });
                            }
                        }
                    });
                    this.csvTable.tableCsvData.push(tableNode);
                }
            });
            this.csvTable.tableCsvData.forEach( node => {
                node['Columns after \'Subfamily name\', if any, are \'Known functions\'. Each \'Known function\' is a GO molecular function term that is annotated to at least one member of the gene family AND that the annotation is supported by an experimental evidence. Number 1 or 0 indicates the presence or absence of a particular function in a gene.']=null;                        
            });
            this.csvTable.tableCsvFields.push('Columns after \'Subfamily name\', if any, are \'Known functions\'. Each \'Known function\' is a GO molecular function term that is annotated to at least one member of the gene family AND that the annotation is supported by an experimental evidence. Number 1 or 0 indicates the presence or absence of a particular function in a gene.');
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
    }
}
</script>

<style scoped>
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
    padding-top: 0px;
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