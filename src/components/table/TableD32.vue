<template>
    <div id="parent">
        <modal v-if="showPopup" @close="showPopup = false">
            <div slot="header">{{popupHeader}}</div>
            <template slot="body" slot-scope="props">
                <popupTable v-if="popupData.length > 0" :data="popupData" :cols="popupCols"></popupTable>
                <div v-if="popupData.length===0"><i>No Go Annotations for this gene!</i></div>
            </template>
        </modal>
        <table class="mainTable">
            <thead id="head">
                <col>
                <colgroup :span="extraCols.length-5"></colgroup>
                <tr id="secTr" v-if="extraCols.length > 0">
                    <th colspan="2" class="noDisplay"></th>
                    <th :colspan="extraCols.length" scope="colgroup" class="speTr">Known Function</th>
                    <th colspan="3" style="background-color: transparent"></th>
                </tr>
                <tr id="mainTr">
                    <th v-for="col in cols">{{col}}</th>
                </tr>
            </thead>
            <tbody id="body">
                <tr v-for="entry in data" @click="rowClicked(entry)">
                    <td v-for="key in cols">
                        <svg :width=tdWidth :height=tdHeight>
                            <g>
                                <text v-if="entry[key] != '*'"
                                      dy=".35em" x=5 y=20>{{entry[key]}}</text>
                                <circle v-if="entry[key] == '*'" class="anno_circle"
                                      cx="100" cy="18"></circle>
                            </g>
                        </svg>
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

    export default {
        name: "tablelayout2",
        components: {
            popupTable: popupTable,
            'modal': customModal
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
                popupData: []
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
                    this.update();
                }
            },
            store_getCenterNode: {
                handler: function (val, oldVal) {
                    if(val == null) return;
                    var foundRow = this.stateTreeData.find(d => d["Gene ID"] === val.geneId);
                    if(foundRow) {
                        this.setScrollToRow(foundRow.id);
                    }
                }
            },
            store_annoMapping: {
                handler: function (val, oldVal) {
                    this.extraCols = val.headers;
                }
            }
        },
        mounted: function () {
            if (this.stateTreeData) {
                this.update();
            }
            const tbody = document.getElementById("body");
            tbody.addEventListener('scroll', _.throttle(this.handleScroll, 10));
            this.extraCols = this.store_annoMapping.headers;
        },
        methods: {
            ...mapActions({
                stateSetTableScroll: types.TABLE_ACTION_SET_SCROLL
            }),
            //Is called on every change to the store data
            update() {
                var titles = d3.keys(this.stateTreeData[0]);
                titles = titles.splice(1);
                this.cols = titles;
                this.data = this.stateTreeData;
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
                console.log(num);
                var centerRow = num-8;
                const tbody = document.getElementById("body");
                tbody.scrollTop = 41*centerRow;
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
                this.popupData = this.getFormattedAnnotationsList(uniprotId);
            },
            getFormattedAnnotationsList(uniprotId) {
                var annosForGene = this.store_annoMapping.annoMap[uniprotId];
                // console.log(annosForGene);
                var annoList = [];
                if(!annosForGene) return annoList;
                annosForGene.forEach(a => {
                    var id = a.goId;
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

                    var findGoId = annoList.find(a => {return a.goId === id;});
                    if(!findGoId) {
                        annoList.push({
                            goId: a.goId,
                            goTerm: a.goName,
                            code: code,
                            reference: [{
                                count: 1,
                                link: refLink
                            }],
                            source: "QuickGO",
                            sourceLink: "https://www.ebi.ac.uk/QuickGO/term/" + a.goId
                        });
                    } else {
                        findGoId.reference.push({
                            count: findGoId.reference.length + 1,
                            link: refLink
                        })
                    }
                });
                return annoList;
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
        height: 800px;
        overflow: hidden;
    }
    .mainTable {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        height: 800px;
        border: 0px solid #9CC255;
        border-collapse: collapse;
        overflow: hidden;
        /* Use this to create a "dead" area color if table is too wide for cells */
        /*background-color: #d6daeb;*/
        font-size: 14px;
        font-family: sans-serif;
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
    }
    #secTr {
        height: 35px;
        max-height: 35px;
        min-height: 35px;
        filter: brightness(100%) !important;
        cursor: default !important;
        border-bottom: 3px solid #f1f1f0;
        background-color: transparent;
    }
    .mainTable tbody {
        overflow: scroll;
    }
    .mainTable tr:nth-child(even) {
        background-color: #d6daeb;
    }
    .mainTable tr:nth-child(odd) {
        background-color: #eceef6;
    }
    .mainTable tr:hover {
        filter: brightness(85%);
    }
    .mainTable th {
        background-color: #e1e7f3;
        text-align: center;
    }
    .mainTable .thHide {
        visibility: hidden;
    }
    .mainTable th, .mainTable td {
        /*background-color: #e1e7f3;*/
        min-width: 200px;
        width: 200px;
        max-width: 200px;
        min-height: 40px;
        max-height: 40px;

        border: 1px solid #f1f1f0;
        /*box-shadow: 5px 0 2px -2px #f1f1f0;*/

        word-wrap: break-word;
        cursor: pointer;
    }
    .mainTable td:first-child,
    .mainTable th:first-child {
        position: sticky;
        position: -webkit-sticky;
        left:0;
        box-shadow: 5px 0 2px -2px #f1f1f0;
        background-color: #d6daeb;
    }

    .speTr {
        background-color: #6687c6 !important;
        color: white;
        text-align: left !important;
        text-indent: 50px;
    }

    .noDisplay {
        background-color: transparent !important;
        box-shadow: none !important;
    }

    .anno_circle {
        r: 8;
        fill: #ff0;
        stroke: steelblue;
        stroke-width: 2px;
    }
</style>

