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
                <tr v-for="(row) in data" >
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
                cols: [],
                data: [],
                extraCols: [],
                tdWidth: '190px',
                tdHeight: '30px',
                rowHeight: 40,
                scrollFromTree: false,
                showPopup: false,
                popupHeader: "",
                popupCols: ["GO term", "Evidence description", "Reference", "With/From", "Source"],
                popupData: [],
                topMargin: 0,
                isLoading: false
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
        },
        methods: {
            ...mapActions({
                stateSetTableScroll: types.TABLE_ACTION_SET_SCROLL,
            }),
            initAfterLoad() {
                setTimeout(() => {
                    this.$refs.tbody.addEventListener('scroll', _.throttle(this.handleScroll, 10));
                    this.extraCols = this.store_annoMapping.headers;
                },10);
            },
            //Is called on every change to the store data
            update() {
                var titles = d3.keys(this.stateTreeData[0]);
                titles = titles.splice(1);
                this.cols = titles;
                this.data = this.stateTreeData;

                if(this.isLoading) {
                    setTimeout(() => {
                        this.initAfterLoad();
                        this.isLoading = false;
                    },100);
                }
            },
            handleScroll() {
                //If scrolling is from tree, we don't need to update the table scroll again
                if(this.scrollFromTree) {
                    this.scrollFromTree = false;
                    return;
                }
                let tbodyScrollL = document.getElementById("body").scrollLeft;
                this.scrollTableHeader(tbodyScrollL);
                let tBodyScrollT = document.getElementById("body").scrollTop;
                this.scrollTreeFromTable(tBodyScrollT);
            },
            scrollTableHeader(amount) {
                let thead = document.getElementById("head");
                thead.scrollLeft = amount;
            },
            scrollTreeFromTable(amount) {
                var rowNumber = amount/this.rowHeight;
                rowNumber = Math.round(rowNumber);
                var geneId = this.stateTreeData[rowNumber]["Gene ID"];
                var scroll = {i: rowNumber, id: geneId};
                this.stateSetTableScroll(scroll);
            },
            setScrollToRow(num) {
                var centerRow = num-8;
                const tbody = document.getElementById("body");
                tbody.scrollTop = 40*centerRow;
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

