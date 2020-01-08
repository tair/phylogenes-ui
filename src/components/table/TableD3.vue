<template>
    <div id="parent" :style="{ width: window.width+'px', height: window.height-50 + 'px' }">
        <modal v-if="showPopup" @close="showPopup = false">
            <div slot="header">{{popupHeader}}</div>
            <template slot="body" slot-scope="props">
                <popupTable v-if="popupData.length > 0" :data="popupData" :cols="popupCols"></popupTable>
                <div v-if="popupData.length===0"><i>No Go Annotations for this gene!</i></div>
            </template>
        </modal>
        <div v-if="showMsaLegend" class="legend-box">
            <msa-legend></msa-legend>
        </div>
        <i v-if="this.isLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
        <table v-else class="mainTable">
            <thead id="head" ref="thead">
                <button v-if="msaTab" class="btn bg-white float-right msalegendbtn" @click="toggleLegend">
                    <span class="text-danger">{{showMsaLegend?"Hide Legend":"Show Legend"}}</span>
                </button>
                <button class="btn bg-white float-left showMsaBtn" @click="toggleTabs">
                    <span class="text-danger">{{msaTab?"Show Gene Info":"Show MSA"}}</span>
                </button>     
                <tr id="main2Tr">
                    <!-- <th class="widthTree stickyCol"></th> -->
                    <th colspan="3" style="background-color=transparent; border-right: 0">
                        <div v-if="n_annotations>0 && !msaTab" style="height: 100px"></div>
                        <div v-else style="height: 40px"></div>
                    </th>
                    <th v-for="(col,i) in colsToRender.slice(2,2+n_annotations)" :key="i+2" :class="getThClasses(col, i+2)" rowspan="2">
                        <tablecell :content="getHeader(col, i+2)"></tablecell>
                    </th>
                </tr>

                <tr id="mainTr">
                    <th :class="getThClasses('tree', -1)">
                        <tree-layout-menu ref="tlmenu" :csvTable="csvTable" :dropdownMenu="treeDropdownMenu" :treeId="treeId"
                                            v-on:ddItemClicked="ddClicked"
                                            v-on:onSearch="onSearchWithinTree"
                                            v-on:onDefaultView="onDefaultView"
                                            v-on:expandAll="expandAll"
                                            v-on:onShowLegend="showLegend"></tree-layout-menu>
                    </th>
                    <!-- <th v-for="(col,i) in colsToRender" :key="i" :class="getThClasses(col, i)">
                        <tablecell :content="getHeader(col, i)"></tablecell>
                    </th> -->
                    <th v-for="(col,i) in colsToRender.slice(0,2)" :key="i" :class="getThClasses(col, i)">
                        <tablecell :content="getHeader(col, i)"></tablecell>
                    </th>
                    <th v-for="(col,i) in colsToRender.slice(2+n_annotations,5+2+n_annotations)" :key="i+2+n_annotations" :class="getThClasses(col, i+2+n_annotations)">
                        <tablecell :content="getHeader(col, i+2+n_annotations)"></tablecell>
                    </th>

                </tr>
            </thead>
            <tbody id="body" ref="tbody">
                <tr>
                    <td :rowspan="treeRowSpan" :class="getTdClasses('tree', -1, -1)">
                        <treelayout  :jsonData="treeDataFromProp" :heightFP="rowsHeight"
                                        ref="treeLayout"
                                        v-on:init-tree="onTreeInit"
                                        v-on:get-table-csv-data="getTableCsvData"
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
    import treeLayoutMenu from '@/components/menu/TreeLayoutMenu';

    export default {
        name: "tablelayout",
        props: [
            "treeDataFromProp",
            "colsFromProp",
            "headerMap", //Map: ['Original Col Name': 'Updated Col Name']
            "treeId",
            "csvTable"
        ],
        components: {
            treelayout: treelayout,
            popupTable: popupTable,
            searchBox: searchBox,
            'modal': customModal,
            tablecell: baseCell,
            msaLegend: msaLegend,
            treeLayoutMenu: treeLayoutMenu
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
                window: {
                width: 0,
                height: 0
                },
                //Tree
                treeRowSpan: 100,
                rowsHeight: 1000,
                treeDropdownMenu: [
                    {id: 0, title: "Download tree as PhyloXML"},
                    // {id: 1, title: "Download gene table as CSV"},
                    {id: 2, title: "Save tree image as PNG"},
                    {id: 3, title: "Save tree image as SVG"},
                    {id: 4, title: "Prune tree by organism"},
                ],
                //Popup
                showPopup: false,
                popupHeader: "",
                popupCols: ["GO term", "Evidence description", "Reference", "With/From", "Source"],
                popupData: [],

                showMsaLegend: false,
                //CSV
                tableCsvData: [],
                tableCsvFields:[
                    'Uniprot ID',
                    'Gene',
                    'Gene ID',
                    'Gene name',
                    'Organism',
                    'Protein name',
                    'Subfamily name'
                ],
                //Popover
                popover1Text: 'This information was extracted from GOA <a href="https://www.ebi.ac.uk/GOA/" target="_blank">(https://www.ebi.ac.uk/GOA/)</a>. Only Molecular Function annotations with Experimental Evidence are shown.',
                popover2Text: 'A gene symbol that is extracted from the GeneName filed of a fasta header in the UniProt protein fasta file <a href="https://www.uniprot.org/help/fasta-headers" target="_blank">(https://www.uniprot.org/help/fasta-headers)</a>.',
                popover3Text: 'A gene ID is a canonical accession extracted from the Reference Proteomes gene2acc gene mapping file <a href="https://www.ebi.ac.uk/reference_proteomes" target="_blank">(https://www.ebi.ac.uk/reference_proteomes)</a>.',
                popover4Text: 'This information was extracted from the ProteinName filed of a fasta header in the UniProt protein fasta file <a href="https://www.uniprot.org/help/fasta-headers" target="_blank">(https://www.uniprot.org/help/fasta-headers)</a>.',
                popover5Text: 'The name of a subfamily is transferred from the representative member of the subfamily <a href="https://conf.arabidopsis.org/display/PHGSUP/FAQ" target="_blank">(see more).</a>'
            }
        },
        created() {
            window.addEventListener('resize', this.handleResize)
            this.handleResize();
        },
        destroyed() {
            window.removeEventListener('resize', this.handleResize)
        },
        computed: {
            ...mapGetters({
                store_tableData: types.TABLE_GET_DATA,
                store_getCenterNode: types.TREE_GET_CENTER_NODE,
                store_annoMapping: types.TREE_GET_ANNO_MAPPING,
                store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
            }),
           
        },
        watch: {
            store_tableData: {
                handler: function (val, oldVal) {
                    //This is zero, when a new tree is reloaded.
                    if(val && val.length == 0) {
                        this.resetTable();
                    } else {
                        this.initTable();
                    }
                },
                deep: true,
                immediate: true
            },
            colsFromProp: {
                handler: function(val, oldval) {
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
                    if(oldVal && oldVal.id == val.id) { return; }
                    //Timeout required so that 'storeTableData' is updated after matched nodes are processed
                    setTimeout(() => {
                        this.findRowandScroll(val);
                    }, 1000);
                },
                deep: true,
                immediate: true
            }
        },
        mounted() {
            this.resetTable();
            this.initTable();
        },
        methods: {
            handleResize() {
                this.window.width = window.innerWidth;
                this.window.height = window.innerHeight;

            },
            ...mapActions({
                store_setTableIsLoading: types.TABLE_ACTION_SET_TABLE_ISLOADING,
                store_setTableData: types.TABLE_ACTION_SET_DATA
            }),
            resetTable() {
                this.rowsToRender = [];
                this.colsToRender = [];
                if(this.$refs.treeLayout) {
                    this.$refs.treeLayout.refreshView();
                }
                if(this.$refs.tlmenu) {
                    this.$refs.tlmenu.onReset();
                }
                this.store_setTableIsLoading(true);
            },
            initTable() {
                this.store_setTableIsLoading(true);
                this.addCustomScrollEvent();
            },
            updateTableCols() {
                if(!this.colsFromProp || !this.store_tableData) return;
                //Only display cols which have corresponding rows in store tableData
                var filteredCols = d3.keys(this.store_tableData[0]);
                filteredCols = filteredCols.filter(t => this.colsFromProp.includes(t));
                //Add all annotation cols to 'filteredCols' array if it is present in 'colsFromProp'
                if(this.colsFromProp.includes("Annotations")) {
                    this.store_annoMapping.headers.forEach(h => {
                        filteredCols.splice(2, 0, h);
                    });
                }
                // console.log(this.colsFromProp);
                this.colsToRender = filteredCols;
                this.rowsToRender = [];
            },
            toggleTabs() {
                this.msaTab = !this.msaTab;
                this.$emit('toggle-cols');
                this.updateRenderRows();
            },
            toggleLegend() {
                this.showMsaLegend = !this.showMsaLegend;
            },
            //~~~~~~~~~~~~~~~~~~~~~~~~~ TREE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            setTableRow(n, index) {
                var tableNode = {};
                tableNode["id"] = index;
                var geneId = n.data.gene_id;
                if (geneId) {
                    geneId = geneId.split(':')[1];
                }
                tableNode["Gene"] = n.data.gene_symbol ? n.data.gene_symbol:geneId;
                tableNode["Organism"] = n.data.organism;
                tableNode["Gene name"] = n.data.gene_symbol;
                tableNode["Gene ID"] = geneId;
                tableNode["Protein name"] = n.data.definition;
                tableNode["Uniprot ID"] = n.data.uniprotId;
                tableNode["Subfamily Name"] = n.data.sf_name;
                tableNode["MSA"] = n.data.sequence;
                if(n.data.accession) tableNode["accession"] = n.data.accession;
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
                //Table data must changed on every tree update.
                //Note: This even changes after the first tree init call.
                this.setStoreTableData(nodes);
                this.rowsToRender = [];
                this.store_tableData.forEach(n => {
                    let processedRowData = this.processRow(n);
                    this.rowsToRender.push(processedRowData);
                });
                //Adjust tree column span and height, to fill the whole table and match the original table height
                this.treeRowSpan = this.rowsToRender.length+1;
                this.rowsHeight = this.rowsToRender.length*40;
                setTimeout(() => {
                    this.store_setTableIsLoading(false);
                });
            },
            //Called from external parent component
            updateRenderRows() {
                this.rowsToRender = [];
                if(this.store_tableData) {
                    this.store_tableData.forEach(n => {
                        let processedRowData = this.processRow(n);
                        this.rowsToRender.push(processedRowData);
                    });
                }
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
                this.$refs.tlmenu.onReset();
            },
            expandAll() {
                this.$refs.treeLayout.onExpandAll();

            },
            onSearchWithinTree(text) {
                this.$emit('search-tree', text);
            },
            onPruneLoading(isLoad) {
                this.$refs.treeLayout.onPruneLoading(isLoad);
            },
            ///~~~~~~~~~~~~~~~~~~~~~~~~~~ Dropdown Menu Click Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
            ddClicked(id) {
                console.log(id);
                if(id == -1) {
                    this.dropdownMenuClicked();
                } else {
                    switch(id) {
                        case 0:
                            this.exportXML();
                            break;
                        case 1:
                            break;
                        case 2:
                            this.exportPNG();
                            break;
                        case 3:
                            this.exportSVG();
                            break;
                        case 4:
                            this.pruneTreeFromMenu();
                        default:
                            console.log("Error! Unknown Dropdown ID");
                    }
                }
            },
            //If dropdown btn is clicked in the tree menu, set table head css to "overflow: visible"
            // This is immediately turned hidden when we scroll inside the "handlescroll" function
            // This displays the dropdown menu correctly on top of the table
            dropdownMenuClicked() {
                if(document.getElementById("head")) {
                    document.getElementById("head").style.overflowX = "visible";
                }
            },
            exportXML() {
                this.$emit('export-xml');
            },
            exportPNG() {
                this.$refs.treeLayout.onExportPng(this.treeId);
            },
            exportSVG() {
                this.$refs.treeLayout.onExportSvg(this.treeId);
            },
            pruneTreeFromMenu() {
                this.$emit('prune-from-menu');
            },
            //~~~~~~~~~~~~~~~~~~~~~~~~~~ Table Utils ~~~~~~~~~~~~~~~~~~~~//
            getTableCsvData(nodes) {
                this.$emit('set-csv-data', nodes);
            },
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
                if(document.getElementById("head")) {
                    document.getElementById("head").style.overflowX = "hidden";
                }
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
                if(this.rowsScrolled > 0) {
                    const tbody = document.getElementById("body");
                    if(tbody) {
                        tbody.scrollTop = 40*this.rowsScrolled;
                    }
                }
            },
            //Find Row in the table based on 'val' and scroll the table to that row
            findRowandScroll(val) {
                var foundRow = this.store_tableData.find(d => d["Gene ID"] === val.geneId);
                if(!foundRow) {
                    let accession = val.data.accession;
                    foundRow = this.store_tableData.find(d => d["accession"] === accession);
                }
                if(foundRow) {
                    this.setScrollToRow(foundRow.id);
                }
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
            getHeader(title, i) {
                let header = {text: title};
                if(this.headerMap[title]) {
                    header['text'] = this.headerMap[title];
                }
                if(i > 1 && i < this.n_annotations+2) {
                    header['type'] = 'slanted';
                }
                return header;
            }, 
            getThClasses(colName, col_idx) {
                let classes = [];
                if(colName == "tree") {
                    //Sets min width for tree header
                    classes.push('widthTree');
                    //Sets the column to be sticky while scrolling left/right
                    classes.push('stickyCol1');
                }
                //Set default width for cols which are not annotations or 'msa'
                else if(this.colsFromProp.includes(colName)) {
                    if(colName == "MSA") {
                        classes.push('widthMax');
                    } else {
                        classes.push('widthDefault');
                    }
                } else {
                    classes.push('widthMin');
                    classes.push('cell-no-border');
                }
                //col_idx = 0 is 'Gene', which is the 2nd column in table which needs to be sticky
                if(col_idx == 0) {
                    classes.push('stickyCol2');
                }
                return classes;
            },
            getTdClasses(colName, cellValue, col_idx) {
                let classes = [];
                if(colName == "tree") {
                    //Sets min width for tree header
                    classes.push('widthTree');
                    classes.push('stickyCol1');
                }
                //Set default width for cols which are not annotations or 'msa'
                else if(this.colsFromProp.includes(colName)) {
                    if(colName == "MSA") {
                        classes.push('widthMax');
                    } else {
                        classes.push('widthDefault');
                    }
                } else {
                    classes.push('widthMin');
                    classes.push('cell-no-border');
                }
                //col_idx = 0 is 'Gene', which is the 2nd column in table which needs to be sticky
                if(col_idx == 0) {
                    classes.push('stickyCol2');
                }
                if(colName=="Gene name") {
                    classes.push('left-border');
                }
                if(cellValue && cellValue.text == '*') {
                    classes.push('tdHover');
                }
                return classes;
            },
        }
    }
</script>
<style scoped>
    #parent {
        /* width: 1600px;
        height: 1200px; */
        overflow: hidden;
        padding-bottom: 20px;
    }
    .mainTable {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        height: 95%;
        overflow: hidden;
        font-size: 14px;
        font-family: sans-serif;
    }
    .mainTable thead {
        flex: 0 0 auto;
        display: block;
        overflow-x: hidden;
        overflow-y: visible;
        background-color: #9cd5e3;
    }
    .mainTable tbody {
        overflow: scroll;
    }
    #mainTr {
        border-top: 3px solid #f1f1f0;
        border-bottom: 3px solid #f1f1f0;
        filter: brightness(100%) !important;
        cursor: default !important;
        background-color: #9cd5e3;
    }
    #main2Tr {
        background-color: #9cd5e3;
    }
    /* Default th*/
    .mainTable th {
        text-align: center;
        border-right: 3px solid #f1f1f0;
    }
    .mainTable td {
        height: 40px !important;
        border-right: 3px solid #f1f1f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis !important;
    }
    /* Override special ths, tds */
    th.widthTree, td.widthTree {
        min-width: 700px;
    }
    th.widthDefault, td.widthDefault {
        position: relative;
        min-width: 200px;
        width: 200px;
        max-width: 200px;
    }
    th.widthMin, td.widthMin {
        position: relative;
        min-width: 50px;
        width: 50px;
        max-width: 50px;
        z-index: 4;
    }
    th.widthMax, td.widthMax {
        text-align: left !important;
        font-size: 14px !important;
        white-space: nowrap;
        max-width: 100%;
        font-family: monospace;
        letter-spacing: 0.1px;
    }
    /* bg is required for sticky td and th so that they hide the other elements behind */
    th.stickyCol1, td.stickyCol1 {
        background-color: #9cd5e3;
        position: sticky;
        left: 0;
        z-index: 11;
    }
    th.stickyCol2, td.stickyCol2 {
        background-color: #9cd5e3;
        position: sticky;
        left: 700px;
        z-index: 11;
    }
    /* Even odd row colors */
    .mainTable tr:nth-child(even), tr:nth-child(even) td.stickyCol2{
        background-color: #cdeaf5;
    }
    .mainTable tr:nth-child(odd), td.stickyCol2{
        background-color: #e9e9e9;
    }
    th.cell-no-border {
        border-bottom: 2px solid #f1f1f0;
        border-left: 0;
        border-right: 0;
    }
    td.cell-no-border{
        border-right: 1px solid #f1f1f0 !important;
        border-left: 1px solid #f1f1f0 !important;
    }
    td.left-border{
        border-left: 3px solid #f1f1f0 !important;
    }
    td.tdHover:hover {
        background-color: #e1e7f3 !important;
        filter: brightness(85%);
        cursor: pointer;
    }

    /* Fixed posn buttons */
    .showMsaBtn {
        position: absolute;
        left: 10px;
        top: 130px;
        z-index: 100;
    }
    .msalegendbtn {
        position: absolute;
        right: 10px;
        top: 130px;
        z-index: 100;
    }
    .legend-box {
        background-color: #9E9E9E;
        position: absolute;
        top: 160px;
        right: 0px;
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