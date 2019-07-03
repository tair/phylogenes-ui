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
        <table v-else class="mainTable" :style="{marginTop: topMargin+'px'}"> 
            <thead id="head" ref="thead">
                <col>
                <colgroup :span="extraCols.length-5"></colgroup>
                <tr id="secTr">
                    <th colspan="2" class="thInvis"></th>
                    <th v-if="extraCols.length > 0" 
                        :colspan="extraCols.length" scope="colgroup" class="thSubCol">Known Function</th>
                    <th colspan="4" class="thInvis"></th>
                </tr>
                <tr id="mainTr">
                    <th v-for="(col,i) in cols" :key="col" 
                        :class="{thSubColSp: i>1&&i<extraCols.length+1}">
                            <tablecell :cellText="col" :type="'th'"></tablecell>
                    </th>
                </tr>
            </thead>
            <tbody id="body" ref="tbody">
                <tr v-for="(row) in rowsToRender" >
                    <td v-for="(key, i) in cols" @click="tdClicked(key, row)" :key="key"
                        :class="getTdClasses(row[key], i)">
                        <tablecell :cellText="row[key]"></tablecell>
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
    import tablecell from '@/components/table/TableCellD3';

    export default {
        name: "tablelayout",
        components: {
            popupTable: popupTable,
            'modal': customModal,
            tablecell: tablecell
        },
        data() {
            return {
                lazyLoad: false, //lazy load flag for rendering rows only within view
                cols: [],
                rowsToRender: [],
                extraCols: [],
                tdWidth: '190px',
                tdHeight: '30px',
                rowHeight: 40,
                scrollFromTree: false,
                scrollTop_old: 0,
                showPopup: false,
                popupHeader: "",
                popupCols: ["GO term", "Evidence description", "Reference", "With/From", "Source"],
                popupData: [],
                topMargin: 0,
                isLoading: false,
                firstLoad: false,
                ticking: false,
                rowsScrolled: 0,
                upperLimit: 100
            }
        },
        computed: {
            ...mapGetters({
                stateTreeData: types.TREE_GET_DATA,
                store_getCenterNode: types.TREE_GET_CENTER_NODE,
                store_annoMapping: types.TREE_GET_ANNO_MAPPING
            })
        },
        watch: {
            stateTreeData: {
                handler: function (val, oldVal) {
                    if(val.length == 0) {
                        this.isLoading = true;
                    }
                    if(val != null && val.length > 0) {
                        this.update();
                    }
                }
            },
            store_getCenterNode: {
                handler: function (val, oldVal) {
                    if(val == null || this.isLoading) return;
                    var foundRow = this.stateTreeData.find(d => d["Gene ID"] === val.geneId);
                    if(!foundRow) {
                        let accession = val.data.accession;
                        foundRow = this.stateTreeData.find(d => d["accession"] === accession);
                    }
                    if(foundRow) {
                        this.setScrollToRow(foundRow.id);
                    }
                }
            },
            store_annoMapping: {
                handler: function (val, oldVal) {
                    this.extraCols = val.headers;
                    if(this.extraCols.length === 0) {
                        this.topMargin = 35;
                    } else {
                        this.topMargin = 0;
                    }
                }
            }
        },
        mounted: function () {
            this.isLoading = true;
            if(this.stateTreeData) {
                this.update();
            }
            this.store_setTableIsLoading(true);
        },
        methods: {
            ...mapActions({
                stateSetTableScroll: types.TABLE_ACTION_SET_SCROLL,
                store_setTableIsLoading: types.TABLE_ACTION_SET_TABLE_ISLOADING
            }),
            initAfterLoad() {
                setTimeout(() => {
                    //handleScroll is called with a throttle of 10 ms, this is to control the number of 
                    // calls made to the function, on scorlling of mouse.
                    this.$refs.tbody.addEventListener('scroll', 
                            _.throttle(this.handleScroll, 10));
                    this.extraCols = this.store_annoMapping.headers;
                },10);
            },
            //Is called on every change to the store data
            update() {
                var titles = d3.keys(this.stateTreeData[0]);
                titles = titles.splice(1);
                this.cols = titles;
                this.rowsToRender = [];
                //If the total number of rows is > 
                if(this.stateTreeData.length > 1000) {
                    this.lazyLoad = true;
                    this.updateRows();
                } else {
                    this.rowsToRender = this.stateTreeData;
                }
                
                if(this.isLoading) {
                    setTimeout(() => {
                        this.initAfterLoad();
                        this.isLoading = false;
                        this.store_setTableIsLoading(false);
                    },100);
                }
            },
            //if lazyLoad=true, only add 'noOfRowsToAdd' to the table, instead of all rows.
            //This depends on rowsScrolled var.
            //If rowsScrolled>500, we also cut off rows from the top using 'noOfTopRowsToRemove'
            updateRows() {
                if(!this.lazyLoad) return;

                //rowsScrolled is the number of rows scrolled by mouse or through panning of tree.
                //We add all the rows scolled to the table
                let noOfRowsToAdd = 30 + this.rowsScrolled*2;
                let noOfTopRowsToRemove = 0;
                if(this.rowsScrolled > 500) {
                    //If the rowsScrolled becomes greater than 500, then the table rendering becomes slow.
                    // So, we remove some of the top rows from being rendered too.
                    noOfTopRowsToRemove = this.rowsScrolled - this.upperLimit;
                    noOfRowsToAdd = 30 + this.rowsScrolled;
                }

                let i = 0;
                this.rowsToRender = [];
                //this.rowsToRender - add rows ranging from index [noOfTopRowsToRemove] to [noOfRowsToAdd].
                this.stateTreeData.some(n => {
                    //Only add rows after the 'noOfTopRowsToRemove'
                    if(i >= noOfTopRowsToRemove) {
                        this.rowsToRender.push(n);
                    }
                    i++;
                    return i > noOfRowsToAdd;
                });
            },
            handleScroll() {
                //If scrolling is from tree (programattic), handleScroll is still being called.
                // So we just return without changing anything.
                if(this.scrollFromTree) {
                    this.scrollFromTree = false;
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
                            this.scrollTop_old = scrollTop_curr;
                            this.scrollTreeFromTable(this.scrollTop_old);
                            //Updates rowsToRender based on the scrolled value.
                            this.updateRows();
                        } 
                    }, 1000);
                }
                
                let scrollLeft_curr = document.getElementById("body").scrollLeft;
                this.scrollTableHeader(scrollLeft_curr);
            },
            scrollTableHeader(amount) {
                let thead = document.getElementById("head");
                thead.scrollLeft = amount;
            },
            //Move the tree node to the rows scrolled by table.
            //We do this by setting store 'stateSetTableScroll' with the 'scroll' row number.
            //Also assign this.rowsScrolled which is used for lazy loading.
            scrollTreeFromTable(amount) {
                var rowNumber = amount/this.rowHeight;
                rowNumber = Math.round(rowNumber);
                var rowId = this.stateTreeData[rowNumber]["Gene ID"];
                var accession = this.stateTreeData[rowNumber]["accession"];
                var scroll = {i: rowNumber, id: rowId, accession: accession};
                this.rowsScrolled = rowNumber;
                this.updateRows();
                this.stateSetTableScroll(scroll);
            },
            setScrollToRow(rowNumber) {
                this.rowsScrolled = rowNumber;
                this.updateRows();
                var centerRowNumber = rowNumber-8;
                if(this.lazyLoad && this.rowsScrolled > 500) {
                    //Lazy Load - correct scrolling
                    setTimeout(() => {
                        centerRowNumber -= this.rowsScrolled - 101;
                        const tbody = document.getElementById("body");
                        tbody.scrollTop = 40*centerRowNumber;
                    }, 1000);

                } else {
                    //Normal scrolling
                    const tbody = document.getElementById("body");
                    tbody.scrollTop = 40*centerRowNumber;
                }
                
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
                        findGoId.reference.push({
                            count: findGoId.reference.length + 1,
                            link: refLink
                        });
                        findGoId.withFrom.concat(withFromList);
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
            getTdClasses(cellValue, col_idx) {
                let classes = [];
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
        border-bottom: 3px solid #f1f1f0;
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
         #secTr th { height: 55px !important; }
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
        min-width: 200px;
        width: 200px;
        max-width: 200px;
        border-right: 3px solid #f1f1f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
</style>

