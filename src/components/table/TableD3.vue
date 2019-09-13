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
                <col>
                <colgroup :span="extraCols.length-5"></colgroup>
                <tr id="secTr">
                    <th :colspan="msaTab?1:2" class="thInvis">
                        <button class="btn bg-white float-left" @click="toggleCols">
                                    <span class="text-danger">{{msaTab?"Show Gene Info":"Show MSA"}}</span>
                        </button>
                        <i v-if="isMsaLoading" class="fa fa-spinner fa-spin fa-2x text-danger px-3 float-left"></i>
                    </th>
                    <th v-if="!msaTab && extraCols.length > 0" 
                        :colspan="extraCols.length" scope="colgroup" class="thSubCol">Known Function</th>
                    <th colspan="4" class="thInvis"></th>
                </tr>
                <tr id="mainTr">
                    <th v-for="(col,i) in colsToRender" :key="i" 
                        :class="getThClasses(col, i)"> 
                            <tablecell :content="getHeader(col)"></tablecell>
                    </th>
                </tr>
            </thead>
            <tbody id="body" ref="tbody">
                <tr v-for="(row, row_i) in rowsToRender" :key=row_i>
                    <td v-for="(key, i) in colsToRender" @click="tdClicked(key, row)" :key="key"
                        :class="getTdClasses(key, row[key], i)">
                        <tablecell :content.sync="rowsToRender[row_i][key]" 
                                    v-on:update:content="onUpdateTest"
                                    v-on:processFinished="onProcessFinished"></tablecell>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
    import * as d3 from 'd3';
    import _ from 'lodash';

    import * as types from '../../store/types_treedata';
    import { mapGetters, mapActions } from 'vuex';

    import popupTable from './PopupTable';
    import customModal from '@/components/modal/CustomModal';
    import baseCell from '@/components/table/cells/BaseTableCell';
    import { setTimeout } from 'timers';

    export default {
        name: "tablelayout",
        props: ["headerMap", "colsFromProp"],
        components: {
            popupTable: popupTable,
            'modal': customModal,
            tablecell: baseCell
        },
        data() {
            return {
                testVal: 'test',
                lazyLoad: false, //lazy load flag for rendering rows only within view
                colsToRender: [],
                rowsToRender: [],
                extraCols: [],
                tdWidth: '190px',
                tdHeight: '30px',
                rowHeight: 40,
                scrollFromTree: false,
                scrollTop_old: 0,
                scrollLeft_old: 0,
                showPopup: false,
                popupHeader: "",
                popupCols: ["GO term", "Evidence description", "Reference", "With/From", "Source"],
                popupData: [],
                isLoading: false,
                isMsaLoading: false,
                firstLoad: false,
                ticking: false,
                rowsScrolled: 0,
                upperLimit: 100,
                msaTab: false,
                processedCells: []
            }
        },
        computed: {
            ...mapGetters({
                store_tableData: types.TABLE_GET_DATA,
                store_getCenterNode: types.TREE_GET_CENTER_NODE,
                store_annoMapping: types.TREE_GET_ANNO_MAPPING,
                store_tableIsLoading: types.TABLE_GET_ISTABLELOADING
            })
        },
        watch: {
            store_tableData: {
                handler: function (val, oldVal) {
                    if(val.length == 0) {
                        this.isLoading = true;
                        this.msaTab = false;
                    }
                    if(val != null && val.length > 0) {
                        this.update();
                        if(this.isLoading) {
                            this.isLoading = false;
                            setTimeout(() => {
                                this.initAfterLoad();
                                this.isLoading = false;
                                this.store_setTableIsLoading(false);
                            });
                        }
                    }
                }
            },
            store_getCenterNode: {
                handler: function (val, oldVal) {
                    if(val == null || this.isLoading) return;
                    var foundRow = this.store_tableData.find(d => d["Gene ID"] === val.geneId);
                    if(!foundRow) {
                        let accession = val.data.accession;
                        foundRow = this.store_tableData.find(d => d["accession"] === accession);
                    }
                    if(foundRow) {
                        this.setScrollToRow(foundRow.id);
                    }
                }
            },
            store_annoMapping: {
                handler: function (val, oldVal) {
                    this.extraCols = val.headers;
                }
            },
            store_tableIsLoading: {
                handler: function(val, oldval) {
                    if(val) {
                        this.isLoading = true;
                        this.rowsScrolled = 0;
                    } else {
                        this.isLoading = false;
                    }
                }
            },
            colsFromProp: {
                handler: function(val, oldval) {
                    if(val.includes("MSA")) {
                        this.msaTab = true;
                    } else {
                        this.msaTab = false;
                    }
                    this.update();
                }
            }
        },
        mounted: function () {
            this.isLoading = true;
            if(this.store_tableData) {
                this.update();
                if(this.isLoading) {
                    this.isLoading = false;
                    setTimeout(() => {
                        this.initAfterLoad();
                        this.isLoading = false;
                        this.store_setTableIsLoading(false);
                    });
                }
            }
            this.store_setTableIsLoading(true);
        },
        updated() {
            this.$nextTick(function () {
                // console.log("Updated Table");
            });
        },
        methods: {
            onProcessFinished(val) {
                var index = this.processedCells.indexOf(val);
                if (index > -1) {
                    this.processedCells.splice(index, 1);
                }
            },
            onUpdateTest(val) {
                if(val.process == true) {
                    if(!this.processedCells.includes(val.id)) {
                        this.processedCells.push(val.id);
                    }
                    if(this.processedCells.length == 1) {
                        this.isMsaLoading = true;
                    }
                } else if(val.process == false) {
                    var index = this.processedCells.indexOf(val.id);
                    if (index > -1) {
                        this.processedCells.splice(index, 1);
                    }
                    if(this.processedCells.length == 0) {
                        this.isMsaLoading = false;
                    }
                }
            },
            ...mapActions({
                store_setTableScrolledRow: types.TABLE_ACTION_SET_SCROLL,
                store_setTableIsLoading: types.TABLE_ACTION_SET_TABLE_ISLOADING
            }),
            toggleCols() {
                this.$emit('toggle-cols');
            },
            initAfterLoad() {
                setTimeout(() => {
                    //handleScroll is called with a throttle of 10 ms, this is to control the number of 
                    // calls made to the function, on scorlling of mouse.
                    if(this.$refs.tbody) {
                        this.$refs.tbody.addEventListener('scroll', 
                            _.throttle(this.handleScroll, 10));
                        this.extraCols = this.store_annoMapping.headers;
                    }
                },10);
            },
            //Is called on every change to the store data
            update() {
                if(!this.colsFromProp) return;
                var filteredCols = d3.keys(this.store_tableData[0]);
                filteredCols = filteredCols.filter(t => this.colsFromProp.includes(t));
                //Add Annotations to 'filteredCols' array if it is present in 'colsFromProp'
                if(this.colsFromProp.includes("Annotations")) {
                    this.store_annoMapping.headers.forEach(h => {
                        filteredCols.splice(2, 0, h);
                    });
                }

                this.colsToRender = filteredCols;
                this.rowsToRender = [];
                this.lazyLoad = true;
                this.updateRows();
            },
            //if lazyLoad=true, only add 'noOfRowsToAdd' to the table, instead of all rows.
            //This depends on rowsScrolled var.
            //If rowsScrolled>500, we also cut off rows from the top using 'noOfTopRowsToRemove'
            updateRows(calledWhileScrolling=false, pm="") {
                // console.log("called by "+ pm);
                if(!this.lazyLoad) return;
                //rowsScrolled is the number of rows scrolled by mouse or through panning of tree.
                //We add all the rows scolled to the table
                let maxRows = 30;
                let noOfRowsToAdd = maxRows + this.rowsScrolled;
                let noOfTopRowsToRemove = this.rowsScrolled;
                let i = 0;
                this.rowsToRender = [];
                //this.rowsToRender - add rows ranging from index 0 to [noOfRowsToAdd].
                // set 'rendering' to false, for all rows less than 'noOfTopRowsToRemove'. Since this
                // rows will be out of view and scrolled up, we don't render the content, for performance reasons.
                this.store_tableData.some(n => {
                    //Only add rows after the 'noOfTopRowsToRemove'
                    if(calledWhileScrolling) {
                        n.rendering = false;
                    } else {
                        if(i < noOfTopRowsToRemove) {
                            n.rendering = false;
                        } else {
                            n.rendering = true;
                        }
                    }
                    let processedRowData = this.processRow(n);
                    this.rowsToRender.push(processedRowData);
                    i++;
                    return i > noOfRowsToAdd;
                });
            },
            processRow(rowData) {
                let row = {};
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
                        if(cellTxt.type && cellTxt.type == 'custom') {
                            content['text'] = cellTxt.value;
                            content['splitByLetter'] = cellTxt.splitByLetter;
                        }
                        content['type'] = 'msa';
                    }
                    row[c] = content;
                });
                return row;
            },
            getContent(colName, celltxt, row) {
                if(row.rendering == false) {
                    return {text: ""};
                }
                let content = {text: celltxt, id: row.id};
                if(celltxt == "*") {
                    content['type'] = 'annotation';
                }
                if(colName == "Uniprot ID") {
                    content['type'] = 'link';
                    content['link'] = 'https://www.uniprot.org/uniprot/'+celltxt;
                }
                if(colName == "MSA") {
                    if(celltxt.type && celltxt.type == 'custom') {
                        content['text'] = celltxt.value;
                        content['splitByLetter'] = celltxt.splitByLetter;
                    }
                    content['type'] = 'msa';
                }
                return content;
            },
            //This is called by the html table's scrolling function (mouse scroll on table)
            handleScroll() {
                //If scrolling is from tree (programattic), handleScroll is still being called.
                // So we just return without changing anything.
                if(this.scrollFromTree) {
                    setTimeout(() => {
                        this.scrollFromTree = false;
                    }, 100);
                    return;
                }

                let scrollLeft_curr = document.getElementById("body").scrollLeft;
                if(this.scrollLeft_old != scrollLeft_curr) {
                    this.scrollLeft_old = scrollLeft_curr;
                    this.scrollTableHeader(scrollLeft_curr);
                    return;
                }
                
                //this.ticking is used to call the more intensive functions like 'scrollTree'
                // and 'updateRows' only once in 1s. This is needed because handleScroll is
                // called a lot of times when the mouse is scrolled in a second, but we don't
                // need to perform methods like updateRows for every call, or it will slow down
                // performance.
                if(!this.ticking) {
                    this.ticking = true;
                    setTimeout(() => {
                        this.ticking = false;
                        let scrollTop_curr = document.getElementById("body").scrollTop;
                        if(scrollTop_curr != this.scrollTop_old) {
                            this.calculateRowsScrolled(scrollTop_curr);
                            this.scrollTop_old = scrollTop_curr;
                            this.scrollTreeFromTable(this.rowsScrolled);
                            //Updates rowsToRender based on the scrolled value.
                            if(this.msaTab) {
                                this.updateRows(true);
                            } else {
                                this.updateRows();
                            }
                            
                        }
                    }, 100);
                }
            },
            calculateRowsScrolled(amount) {
                var rowNumber = amount/this.rowHeight;
                rowNumber = Math.round(rowNumber);
                this.rowsScrolled = rowNumber;
            },
            scrollTableHeader(amount) {
                let thead = document.getElementById("head");
                thead.scrollLeft = amount;
            },
            //Move the tree node to the row number currently at the center of table.
            //We do this by setting store value 'store_setTableScrolledRow' with the 'scroll'ed row number.
            scrollTreeFromTable(rowNumber) {
                var rowId = this.store_tableData[rowNumber]["Gene ID"];
                var accession = this.store_tableData[rowNumber]["accession"];
                var scroll = {i: rowNumber, id: rowId, accession: accession};
                this.store_setTableScrolledRow(scroll);
            },
            //From tree panning
            setScrollToRow(rowNumber) {
                this.rowsScrolled = rowNumber - 8;
                this.updateRows();

                setTimeout(() => {
                    const tbody = document.getElementById("body");
                    if(tbody) {
                        tbody.scrollTop = 40*this.rowsScrolled;
                    }
                }, 100);
                this.scrollFromTree = true;
            },
            rowClicked(d) {
                this.showPopup = true;
                let uniprotId = d["Uniprot ID"];
                if(uniprotId) {
                    uniprotId = uniprotId.toLowerCase();
                } else {
                    uniprotId = "N/A";
                }
                this.popupHeader = "Uniprot ID: " + uniprotId.toUpperCase();
                let annoList = this.getFormattedAnnotationsList(uniprotId);
                this.popupData = this.getPopupData(annoList);
            },
            tdClicked(c, row) {
                if(row[c] != '*') return;
                let uniprotId = row["Uniprot ID"];
                if(uniprotId) {
                    uniprotId = uniprotId.toLowerCase();
                } else {
                    uniprotId = "N/A";
                }
                let uniHeader = "Uniprot ID: " + uniprotId.toUpperCase();
                let annoList = this.getFormattedAnnotationsList(uniprotId);
                annoList = annoList.filter(a => a.goTerm === c);
                if(annoList.length != 0) {
                    this.displayPopup(uniHeader, annoList);
                }
            },
            displayPopup(header, data) {
                this.popupHeader = header;
                this.popupData = this.getPopupData(data);
                this.showPopup = true;
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
                
                if(i > 1&&i<this.extraCols.length+1) {
                    classes.push('thSubColSp');
                }
                return classes;
            },
            getTdClasses(row, cellValue, col_idx) {
                let classes = [];
                if(row == "MSA") {
                    classes.push('widthMax');
                } else {
                    classes.push('widthDefault');
                }
                if(cellValue == '*') {
                    classes.push('tdHover');
                }
                //For all cells belonging to sub columns for annotations
                if(col_idx > 1 && col_idx < this.extraCols.length+1) {
                    classes.push('tdSubCol');
                }
                return classes;
            },
        },
        destroyed: function () {
            window.removeEventListener('scroll', this.handleScroll);
        }
    }
</script>
<style scoped>
    #parent {
        position: absolute;
        width: 95%;
        height: 100%;
        overflow: hidden;
    }
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
    @media (min-height: 432px) {
         #secTr th { height: 35px !important; }
    }
    @media (min-height: 960px) {
         #secTr th { height: 35px !important; }
    }
    .mainTable tbody {
        overflow: scroll;
    }
    .mainTable tr:nth-child(even) {
        background-color: #cdeaf5;
    }
    .mainTable tr:nth-child(odd) {
        background-color: #e9e9e9;
    }
    .mainTable tr {
        height: 40px !important;
    }
    .mainTable th {
        text-align: center;
        border-top: 3px solid #f1f1f0;
    }
    .mainTable .thHide {
        visibility: hidden;
    }
    .mainTable th, .mainTable td {
        border-right: 3px solid #f1f1f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        z-index: 1;
    }

    .mainTable td:first-child,
    .mainTable th:first-child {
        position: sticky;
        position: -webkit-sticky;
        left:0;
        box-shadow: 5px 0 2px -2px #f1f1f0;
        background-color: #9cd5e3;
    }

    .mainTable tr:nth-child(even) td:first-child {
        background-color: #cdeaf5;
    }
    .mainTable tr:nth-child(odd) td:first-child {
        background-color: #e9e9e9;
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
    .thSubColSp {
        border-right: 1px solid #f1f1f0 !important;
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
    }
    .tdSubCol {
        border-right: 1px solid #f1f1f0 !important;
    }
    .tdHover:hover {
        background-color: #e1e7f3 !important;
        filter: brightness(85%);
        cursor: pointer;
    }

    .anno_circle {
        r: 8;
        fill: #ff0;
        stroke: steelblue;
        stroke-width: 2px;
    }

    ::-webkit-scrollbar {
        -webkit-appearance: none;
        width: 7px;
    }
    ::-webkit-scrollbar-thumb {
        border-radius: 4px;
        background-color: rgba(0,0,0,.5);
        -webkit-box-shadow: 0 0 1px rgba(255,255,255,.5);
    }
</style>

