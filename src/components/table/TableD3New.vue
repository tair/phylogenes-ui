<template>
    <div id="parent">
        <modal v-if="showPopup" @close="showPopup = false">
            <div slot="header">{{popupHeader}}</div>
            <template slot="body" slot-scope="props">
                <popupTable v-if="popupData.length > 0" :data="popupData" :cols="popupCols"></popupTable>
                <div v-if="popupData.length===0"><i>No Go Annotations for this gene!</i></div>
            </template>
        </modal>
        <i v-if="this.isLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
        <table v-else class="mainTable">
            <thead id="head" ref="thead">
                <tr id="secTr">
                    <th :colspan='msaTab?2:3' class="thInvis stickyCol">
                        <div class="my-msa">
                            <button class="btn bg-white float-left" @click="toggleTabs">
                                <span class="text-danger">{{msaTab?"Show Gene Info":"Show MSA"}}</span>
                            </button>
                        </div>
                    </th>
                    <th v-if="n_annotations > 0 && !msaTab"
                        :colspan="n_annotations" class="thSubCol">Known Function</th>
                </tr>
                <tr id="mainTr">
                    <th class="widthTree stickyCol">
                        <div class="row align-items-center justify-content-between">
                            <div class="col-auto align-items-center">
                                <search-box ref="searchBox" 
                                        v-on:search="onSearchWithinTree" 
                                        :defaultText="defaultSearchText"></search-box>
                            </div>
                            <div class="col-auto align-items-center">
                                <b-dropdown v-b-tooltip.hover title="Operations" variant="white" class="bg-white" no-caret>
                                    <template slot="button-content">
                                        <i @click="dropdownClicked" class="fas fa-tools fa-2x fa-fw"></i>
                                    </template>
                                    <b-dropdown-item @click="exportXML">Download tree as PhyloXML</b-dropdown-item>
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
                            </div>
                        </div>
                    </th>
                    <th v-for="(col,i) in colsToRender" :key="i"
                            :class="getThClasses(col, i)"> 
                        <tablecell :content="getHeader(col)"></tablecell>
                    </th>
                </tr>
            </thead>
            <tbody id="body" ref="tbody">
                <tr>
                    <td :rowspan="treeRowSpan" class="widthTree stickyCol">
                        <treelayout  :jsonData="treeDataFromProp" :heightFP="rowsHeight"
                                        ref="treeLayout"
                                        v-on:init-tree="onTreeInit"
                                        v-on:updated-tree="onTreeUpdate"></treelayout>
                    </td>
                </tr>
                <tr v-for="(row, row_i) in rowsToRender" :key=row_i>
                    <td v-for="(key, i) in colsToRender" :key="key"
                        @click="tdClicked(key, row)"
                        :class="getTdClasses(key, row[key], i)">
                        <tablecell :content.sync="rowsToRender[row_i][key]"></tablecell>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
    import * as d3 from 'd3';
    import _ from 'lodash';
    import { mapGetters, mapActions } from 'vuex';
    import { setTimeout } from 'timers';

    import * as types from '../../store/types_treedata';
    import popupTable from './PopupTable';
    import customModal from '@/components/modal/CustomModal';
    import baseCell from '@/components/table/cells/BaseTableCell';
    import msaLegend from '../table/MsaLegend';
    import treelayout from '@/components/tree/TreeLayout';
    import searchBox from '@/components/search/SearchBox';

    export default {
        name: "tablelayout",
        props: [
            "treeDataFromProp",
            "colsFromProp",
            "headerMap", //Map: ['Original Col Name': 'Updated Col Name']
            "treeId"
        ],
        computed: {
            ...mapGetters({
                store_tableData: types.TABLE_GET_DATA,
                store_annoMapping: types.TREE_GET_ANNO_MAPPING,
                store_getCenterNode: types.TREE_GET_CENTER_NODE,
                store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
            }),
            showLegendButtonIcon(){
                return this.legendIcon?
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
            store_tableData: {
                handler: function (val, oldVal) {
                    //This is zero, when a new tree is reloaded.
                    if(val.length == 0) {
                        if(this.$refs.searchBox) {
                            this.$refs.searchBox.onReset();
                        }
                    } 
                },
                deep: true,
                immediate: true
            },
            colsFromProp: {
                handler: function(val, oldval) {
                    // console.log("colsFromProp ",val);
                    this.updateTableCols();
                }
            },
            store_annoMapping: {
                handler: function (val, oldVal) {
                    this.n_annotations = val.headers.length;
                }
            },
            //Auto scroll the table to the center node set by the tree (Auto scrolling)
            store_getCenterNode: {
                handler: function (val, oldVal) {
                    if(val == null || this.isLoading) return;
                    var foundRow = this.store_tableData.find(d => d["Gene ID"] === val.geneId);
                    if(!foundRow) {
                        let accession = val.data.accession;
                        foundRow = this.store_tableData.find(d => d["accession"] === accession);
                    }
                    // console.log(foundRow);
                    if(foundRow) {
                        this.setScrollToRow(foundRow.id);
                    }
                },
                deep: true,
                immediate: true
            },
            store_getSearchTxtWthn: {
                handler: function (val, oldVal) {
                    console.log("text ", val);
                },
                deep: true,
                immediate: true
            }
        },
        components: {
            treelayout: treelayout,
            popupTable: popupTable,
            searchBox: searchBox,
            'modal': customModal,
            tablecell: baseCell,
            msaLegend: msaLegend
        },
        data() {
            return {
                isLoading: false,
                colsToRender: [],
                rowsToRender: [],
                lazyLoad: true,
                rowsScrolled: 0,
                n_annotations: 0,
                msaTab: false,
                defaultSearchText: "",
                //Tree
                treeRowSpan: 100,
                rowsHeight: 1000,
                //Popup
                showPopup: false,
                popupHeader: "",
                popupCols: ["GO term", "Evidence description", "Reference", "With/From", "Source"],
                popupData: [],
                //Legend
                legendIcon: false,
                showLegendTip: false,
                tableCsvData: [],
                tableCsvFields:[
                    'Uniprot ID',
                    'Gene',
                    'Gene ID',
                    'Gene name',
                    'Organism',
                    'Protein function',
                    'Subfamily name'
                ],
            }
        },
        mounted() {
            this.initTable();
            this.$refs.searchBox.onReset();
        },
        methods: {
            dropdownClicked() {
                document.getElementById("head").style.overflowX = "visible";
                // if(document.getElementById("head").style.overflowX == "hidden") {
                //     document.getElementById("head").style.overflowX = "visible";
                // } else if(document.getElementById("head").style.overflowX == "visible"){
                //     document.getElementById("head").style.overflowX = "hidden";
                // } else {
                //     document.getElementById("head").style.overflowX = "visible";
                // }
            },
            ...mapActions({
                store_setTableData: types.TABLE_ACTION_SET_DATA
            }),
            initTable() {
                this.addCustomScrollEvent();
            },
            updateTableCols() {
                if(!this.colsFromProp && !this.store_tableData) return;
                //Only display cols which have corresponding rows in store tableData
                var filteredCols = d3.keys(this.store_tableData[0]);
                filteredCols = filteredCols.filter(t => this.colsFromProp.includes(t));
                //Add all annotation cols to 'filteredCols' array if it is present in 'colsFromProp'
                if(this.colsFromProp.includes("Annotations")) {
                    this.store_annoMapping.headers.forEach(h => {
                        filteredCols.splice(2, 0, h);
                    });
                }
                // console.log("filteredCols ", filteredCols);
                this.colsToRender = filteredCols;
                this.rowsToRender = [];
            },
            toggleTabs() {
                this.msaTab = !this.msaTab;
                this.$emit('toggle-cols');

                this.updateRenderRows();
            },
            //~~~~~~~~~~~~~~~~~~~~~~~~~ TREE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            setTableRow(n, index) {
                var tableNode = {};
                tableNode["id"] = index;
                tableNode["Gene name"] = n.data.gene_symbol;
                tableNode["Organism"] = n.data.organism;
                var geneId = n.data.gene_id;
                if (geneId) {
                    geneId = geneId.split(':')[1];
                }
                tableNode["Gene ID"] = geneId;
                tableNode["Protein function"] = n.data.definition;
                tableNode["Uniprot ID"] = n.data.uniprotId;
                tableNode["MSA"] = n.data.sequence;
                //Annotations
                if(n.data.uniprotId) {
                    let uniprotId = n.data.uniprotId.toLowerCase();
                    if(this.store_annoMapping.annoMap[uniprotId]) {
                        let currAnno = this.store_annoMapping.annoMap[uniprotId];
                        let allAnnos = this.store_annoMapping.headers;
                        allAnnos.forEach(a => {
                            currAnno.forEach(c => {
                                if(c.goName === a) {
                                    tableNode[a] = "*";
                                }
                            });
                        });
                    }
                }
                return tableNode;
            },
            setTableAnnotationRow() {
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
            },
            onTreeInit(nodes) {
                // console.log("onTreeInit ", nodes.length);
                let tabularData = this.setStoreTableData(nodes);
                //For metadata
                let uniqueOrganisms = [];
                nodes.forEach(n => {
                    if(!n.children) {
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
                    }
                });
                // this.setMetadata(tabularData, uniqueOrganisms);

                let msg = {tabularData: tabularData, uniqueOrganisms: uniqueOrganisms};
                this.$emit('tree-init', msg);
                this.updateTableCols();
                this.lazyLoad = true;

                if(this.store_getSearchTxtWthn != null) {
                    this.defaultSearchText = this.store_getSearchTxtWthn;
                    setTimeout(() => {
                        this.$emit('search-tree', this.store_getSearchTxtWthn);
                    }, 2000);
                }
            },
            onTreeUpdate(nodes) {
                // console.log("onTreeUpdate ", nodes.length);
                // this.updateRows();
                //Table data must changed on every tree update.
                //Note: This even changes after the first tree init call.
                this.setStoreTableData(nodes);
                this.rowsToRender = [];
                this.store_tableData.forEach(n => {
                    let processedRowData = this.processRow(n);
                    this.rowsToRender.push(processedRowData);
                });
                // console.log(this.rowsToRender.length);
                //Adjust tree column span and height, to fill the whole table and match the original table height
                this.treeRowSpan = this.rowsToRender.length+1;
                this.rowsHeight = this.rowsToRender.length*40;

               
            },
            //Called from external parent component
            updateRenderRows() {
                this.rowsToRender = [];
                this.store_tableData.forEach(n => {
                    let processedRowData = this.processRow(n);
                    this.rowsToRender.push(processedRowData);
                });
            },
            setStoreTableData(nodes) {
                var tabularData = [];
                let i = 0;
                nodes.forEach(n => {
                    if(!n.children) {
                        let row = this.setTableRow(n, i++);
                        tabularData.push(row);
                    }
                });
                this.store_setTableData(tabularData);
                return tabularData;
            },
            //if lazyLoad=true, only add 'noOfRowsToAdd' to the table, instead of all rows.
            //This depends on 'rowsScrolled'
            updateRows(calledWhileScrolling=false, pm="") {
                // console.log("called by "+ pm);
                if(!this.lazyLoad) return;
                //rowsScrolled is the number of rows scrolled by mouse or through panning of tree.
                //We add all the rows scolled to the table
                let maxRows = 30;
                let noOfRowsToAdd = maxRows + this.rowsScrolled;
                let noOfTopRowsToRemove = 0;
                if(this.rowsScrolled > 200) {
                    noOfTopRowsToRemove = this.rowsScrolled - 100;
                }
                let i = 0;
                this.rowsToRender = [];
                //this.rowsToRender - add rows ranging from index 0 to [noOfRowsToAdd].
                // set 'rendering' to false, for all rows less than 'noOfTopRowsToRemove'. Since this
                // rows will be out of view and scrolled up, we don't render the content, for performance reasons.

                this.store_tableData.some(n => {
                    if(i < noOfTopRowsToRemove) {
                        n.rendering = false;
                    } else {
                        n.rendering = true;
                    }
                    let processedRowData = this.processRow(n);
                    this.rowsToRender.push(processedRowData);
                    i++;
                    return i > noOfRowsToAdd;
                });
            },
            //rowData: [colName]:[colValue]
            //returns cellContent: [text: "?", type: <cell-type>, 
                                    // optional additional features for each cell type]
            processRow(rowData) {
                // console.log(rowData);
                let row = {};
                //If 'rendering' is false, row is rendered as default with blank text for performance reasons
                if(rowData.rendering == false) {
                    return {text: ""};
                }
                this.colsToRender.forEach(c => {
                    let cellTxt = rowData[c];
                    let content = {text: cellTxt, id: rowData.id};
                    if(cellTxt == "*") {
                        content.type = 'annotation';
                    }
                    if(c == "MSA") {
                        content.text = cellTxt;
                        content.type = 'msa';
                        content.isHighlight = true;
                    } else if(c == "Uniprot ID") {
                        content.type = 'link';
                        content.link = 'https://www.uniprot.org/uniprot/'+cellTxt;
                    }
                    row[c] = content;
                });
                return row;
            },
            //TREE MENU
            showLegend() {
                this.$refs.treeLayout.onShowLegend();
                this.legendIcon = !this.legendIcon;
            },
            onDefaultView() {
                this.$refs.treeLayout.onDefaultView();
                this.$refs.searchBox.onReset();
            },
            expandAll() {
                this.$refs.treeLayout.onExpandAll();
            },
            exportXML() {
                this.$emit('export-xml');
            },
            exportSVG() {
                this.$refs.treeLayout.onExportSvg(this.treeId);
            },
            exportPNG() {
                this.$refs.treeLayout.onExportPng(this.treeId);
            },
            pruneTreeFromMenu() {
                this.$emit('prune-from-menu');
            },
            onSearchWithinTree(text) {
                this.$emit('search-tree', text);
            },
            onPruneLoading(isLoad) {
                this.$refs.treeLayout.onPruneLoading(isLoad);
            },
            //~~~~~~~~~~~~~~~~~~~~~~~~~~ Table Utils ~~~~~~~~~~~~~~~~~~~~//
            //SCROLL
            addCustomScrollEvent() {
                //On props change, the $refs reloads, so need to add scroll event at the next frame,
                // hance the timeout.
                setTimeout(() => {
                    if(this.$refs.tbody) {
                        //handleScroll is called with a throttle of 10 ms, this is to control the number of 
                        // calls made to the function, on scrolling of mouse.
                        this.$refs.tbody.addEventListener('scroll', 
                                                    _.throttle(this.handleScroll, 10));
                    }
                });
            },
            //This is called by the html table's scrolling function (mouse scroll on table)
            handleScroll() {
                document.getElementById("head").style.overflowX = "hidden";
                let scrollLeft_curr = document.getElementById("body").scrollLeft;
                this.scrollTableHeader(scrollLeft_curr);
            },
            scrollTableHeader(amount) {
                let thead = document.getElementById("head");
                thead.scrollLeft = amount;
            },
            //From tree panning
            setScrollToRow(rowNumber) {
                this.rowsScrolled = rowNumber - 8;
                // this.updateRows();
                if(this.rowsScrolled > 0) {
                    const tbody = document.getElementById("body");
                    if(tbody) {
                        body.scrollTop = 40*this.rowsScrolled;
                    }
                }
                
                // setTimeout(() => {
                //     const tbody = document.getElementById("body");
                //     if(tbody) {
                //         tbody.scrollTop = 40*this.rowsScrolled;
                //     }
                // }, 100);
                // this.scrollFromTree = true;
            },
            //CLICK Cell
            tdClicked(c, row) {
                if(row[c] && row[c].text != '*') return;
                this.$emit('anno-click', {row: row, val: c});
            },
            //Display Popup
            displayPopup(header, data) {
                this.popupHeader = header;
                this.popupData = this.getPopupData(data);
                this.showPopup = true;
            },
            getPopupData(annoList) {
                let popUpTableData = [];
                annoList.forEach(ann => {
                    let singleRow = [];
                    let goTerm = {type: "link", text: ann.goTerm, link: ann.goTermLink};
                    singleRow.push(goTerm);

                    let code = ann.code;
                    singleRow.push(code);

                    let references = {type: "links"};
                    references["links"] = [];
                    ann.reference.forEach(ref => {
                        references["links"].push({text: ref.count, link: ref.link});
                    });
                    singleRow.push(references);

                    let withFrom = {type: "links"};
                    withFrom["links"] = [];
                    ann.withFrom.forEach(wf => {
                        withFrom["links"].push({text: wf.name, link: wf.link});
                    });
                    singleRow.push(withFrom);

                    let source = {type: "link", text: ann.source, link: ann.sourceLink};
                    singleRow.push(source);

                    popUpTableData.push(singleRow);
                });
                return popUpTableData;
            },
            getHeader(title) {
                let header = {text: title};
                if(this.headerMap[title]) {
                    header['text'] = this.headerMap[title];
                }
                return header;
            }, 
            getThClasses(row, i) {
                let classes = [];
                if(row == "MSA") {
                    classes.push('widthMax');
                } else {
                    classes.push('widthDefault');
                }
                
                // if(i > 1&&i<this.extraCols.length+1) {
                //     classes.push('thSubColSp');
                // }
                return classes;
            },
            getTdClasses(row, cellValue, col_idx) {
                let classes = [];
                if(row == "MSA") {
                    classes.push('widthMax');
                } else {
                    classes.push('widthDefault');
                }
                if(col_idx == 0) {
                    classes.push('stickyCol2');
                }
                if(cellValue && cellValue.text == '*') {
                    classes.push('tdHover');
                }
                //For all cells belonging to sub columns for annotations
                // if(col_idx > 1 && col_idx < this.extraCols.length+1) {
                //     classes.push('tdSubCol');
                // }
                return classes;
            },
        }
    }
</script>
<style scoped>
    #parent {
        /* position: absolute; */
        width: 1600px;
        height: 1100px;
        overflow: hidden;
    }
    .mainTable {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        height: 98%;
        border-collapse: collapse;
        overflow: hidden;
        font-size: 14px;
        font-family: sans-serif;
        border-bottom: 5px solid #f1f1f0;
    }
    .mainTable .stickyCol {
        position: sticky;
        position: -webkit-sticky;
        left:0;
    }
    /* .mainTable td:first-child, th:first-child {
        position: sticky;
        position: -webkit-sticky;
        left:0px;
        z-index: 1;
    } */
    /* .mainTable td:nth-child(2),th:nth-child(2)  {
        position: sticky;
        position: -webkit-sticky;
        left:600px;
        z-index: 1;
    } */
    /* Table Header Classes */
    .my-float {
        position: absolute;
        z-index: 1000;
    }
    .mainTable thead {
        flex: 0 0 auto;
        display: block;
        /* required for programmatic scrolling of header */
        overflow-x: hidden;
        overflow-y: visible;
        z-index: 100;
    }
    .mainTable th {
        text-align: center;
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
    .thInvis {
        background-color: transparent !important;
        box-shadow: none !important;
        border: 0 !important;
    }
    .thSubCol {
        background-color: #9cd5e3 !important;
        color: black;
        text-align: left !important;
        text-indent: 50px;
        border-left: 3px solid #f1f1f0 !important;
    }
    .tdHover:hover {
        background-color: #e1e7f3 !important;
        filter: brightness(85%);
        cursor: pointer;
    }
    .thSubColSp {
        border-right: 1px solid #f1f1f0 !important;
    }
    .widthTree {
        min-width: 800px;
        width: 800px;
        max-width: 800px;
        z-index: 10;
    }
    .widthDefault {
        min-width: 200px;
        width: 200px;
        max-width: 200px;
    }
    .widthMax {
        white-space: nowrap;
        max-width: 100%;
        font-family: monospace;
        letter-spacing: 0.1px;
    }
    /* Table Body Classes */
    .mainTable tbody {
        overflow: scroll;
    }
    .mainTable tr:nth-child(even){
        background-color: #cdeaf5;
    }
    .mainTable tr:nth-child(odd){
        background-color: #e9e9e9;
    }
    .mainTable td {
        height: 40px !important;
        border-right: 3px solid #f1f1f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .my-msa {
        position: absolute;
        padding-left: 10px;
        top: 10px;
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