<template>
    <div id="parent">
        <!--<button id="show-modal" @click="showModal = true">Show Modal</button>-->
        <modal v-if="showModal" @close="showModal = false">
            <div slot="header">{{modalHeader}}</div>
            <div slot="body">
                <table class="popupTable">
                    <tr>
                        <th>Col1</th>
                        <th>Col2</th>
                    </tr>
                </table>
            </div>
        </modal>
        <table>
            <thead id="myhead">
                <col>
                <colgroup :span="tableSpanCols.length"></colgroup>
                <tr id="par" v-if="tableSpanCols.length > 0">
                    <th colspan="1"></th>
                    <th colspan="1"></th>
                    <th :colspan="tableSpanCols.length" scope="colgroup">Known Function</th>
                </tr>
                <tr id="main">
                    <!--<th id="anno" scope="col" v-for="(col, i) in tableSpanCols">{{col}}</th>-->
                    <th v-for="(col, i) in tableCols" :scope="getScope">{{col}}</th>
                </tr>
            </thead>
            <tbody id="mybody">

            </tbody>
        </table>
    </div>
</template>

<script>
    import * as d3 from 'd3';
    import _ from 'lodash';

    import * as types from '../../store/types_treedata';
    import { mapGetters, mapActions } from 'vuex';
    import customModal from '@/components/modal/CustomModal';

    export default {
        name: "tablelayout",
        components: {
            'modal': customModal
        },
        data() {
            return {
                scrollVertical: true,
                tableCols: [],
                tableSpanCols: [],
                popUpTableData: {

                },
                tableBody: null,
                index: 0,
                rowHeight: 40,
                scrollFromTree: false,
                showModal: false,
                modalHeader: ""
            }
        },
        computed: {
            ...mapGetters({
                stateTreeData: types.TREE_GET_DATA,
                stateTreeZoomX: types.TREE_GET_ZOOM,
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
            store_annoMapping: {
                handler: function(val, oldVal) {
                    // console.log("Anno ", val);
                }
            },
            stateTreeZoomX: {
                handler: function (val, oldVal) {
                    this.setScroll(val);
                },
            },
            store_getCenterNode: {
                handler: function (val, oldVal) {
                    if(val == null) return;
                    var foundRow = this.stateTreeData.find(d => d["Gene ID"] === val.geneId);
                    if(foundRow) {
                        this.setScrollToRow(foundRow.id);
                    }
                }
            }
        },
        methods: {
            ...mapActions({
                stateSetTableScroll: types.TABLE_ACTION_SET_SCROLL
            }),
            update() {
                this.tableBody = d3.select('table');
                this.renderTableHeader(this.tableBody);
                this.renderTableBody(this.tableBody);
            },
            renderTableHeader(table_d3) {
                var titles = d3.keys(this.stateTreeData[0]);
                titles = titles.splice(1);
                // console.log(titles);
                // console.log(this.store_annoMapping);

                this.tableCols = [];
                this.tableSpanCols = this.store_annoMapping.headers;
                if(titles.length > 0) {
                    this.tableCols = titles;
                }

                // var t_head = table_d3.select('thead');
                // const updateTh = t_head.select('tr.main')
                //                         .selectAll('th')
                //                         .data(titles);
                //
                // const enterTh = updateTh.enter()
                //                     .append("th");
                //
                // updateTh.merge(enterTh)
                //         .text(d => d);

                // const exitTh = updateTh.exit();
                // exitTh.transition().duration(1000)
                // .style("opacity", 0)
                // .remove();
            },
            getScope() {
              return "col";
            },
            renderTableBody(table_d3) {
                var titles = d3.keys(this.stateTreeData[0]);
                titles = titles.splice(1);
                var t_body = table_d3.select('tbody');
                if(titles.length == 0) {
                    t_body
                        .selectAll('tr')
                        .data([]);

                    return;
                }
                //Maps all the tree data into it's own rows.
                // console.log(this.stateTreeData);
                let renderData = [];
                this.stateTreeData.forEach(d => {
                    renderData["Gene name"] = d["Gene name"];
                });
                var rows_d3_map = t_body
                        .selectAll('tr')
                        .data(this.stateTreeData);

                if(rows_d3_map.length === 0) {
                    console.log("No new entering nodes");
                    return;
                }

            //All the rows which are new. At first load it's all the rows from data.
                var rows_entering = rows_d3_map.enter();
                var rows_exiting = rows_d3_map.exit();

                // console.log(rows_entering.size());
                // console.log(rows_exiting.size());
            //Modify the rows entering with appending html tags or modifying its style.
                rows_entering = rows_entering.append('tr')
                            .style("opacity", 0);
                rows_entering.transition().duration(1000)
                            .style("opacity", 1);

                /*
                    selection.merge(other)
                Returns a new selection merging this selection with the specified other selection.
                The returned selection has the same number of groups and the same parents as this selection.
                commonly used to merge the enter and update selections after a data-join.
                */
                var td_rows_map = rows_d3_map.merge(rows_entering);

                td_rows_map = td_rows_map
                                .selectAll('td')
                                .data((d) => {
                                    return titles.map((k) => {
                                        return { 'value': d[k], 'name': k};
                                    });
                                });

                var td_entering = td_rows_map.enter();
                var td_exiting = td_rows_map.exit();
                // console.log(td_entering.size());
                td_entering = td_entering.append('td').attr('class','my-col');
                                            // .append('text')
                // td_entering.append('circle').classed("anno_circle", true);
                // td_entering.append(function(d) {
                //     var div = document.createElement("div");
                //     // var d3Ele = d3.select(this);
                //     // var svg = d3Ele.append("svg").style("width", 200 + 'px').style("height", 25 + 'px');
                //     // if(d.value === "*") {
                //     //     svg.append("circle").classed("anno_circle", true)
                //     //         .attr("cx", 85).attr("cy", 15);
                //     // } else {
                //     //     svg.append("text").text(d.value).attr("font-size", "14px").attr("x",5).attr("y",20);
                //     // }
                //     return div;
                // });

                td_rows_map = td_rows_map.merge(td_entering);

                td_rows_map = td_rows_map
                                .attr('data-th', d => d.name)
                    // .append('svg').style("width", 200 + 'px').style("height", 25 + 'px')
                    // .append("text").text("R").attr("font-size", "14px").attr("x",5).attr("y",20)
                                .text(d => d.value);
                // td_rows_map.selectAll('text').text(function(d,i){
                //     return d.value;
                // });
                // .selectAll('text').each(function(d,i) {
                //    console.log(d);
                // });
                // .select("text").text(d.value)
                // .text(d => d.value)
                // ;

                rows_exiting.transition().duration(5000)
                        .style("opacity", 0)
                        .remove();

                this.tableBody.selectAll("tr")
                    .on("mouseover", function() {
                        d3.select(this).selectAll('td')
                            // .style('background-color', "orange")
                            .style('cursor', "pointer");
                    })
                    .on("mouseleave", function() {
                        // d3.select(this).selectAll('td')
                        //     .style('background-color', "white");
                    })
                    .on("click", (d) => {
                        this.showModal = true;
                        this.modalHeader = "Uniprot ID: " + d["Uniprot ID"];
                    })
            },
            setScrollToRow(num) {
                var centerRow = num-8;
                const tbody = document.getElementById("mybody");
                tbody.scrollTop = 40*centerRow;
                this.scrollFromTree = true;
            },
            setScroll(val) {
                const tbody = document.getElementById("mybody");
                // if(val.y < 0) {
                //     tbody.scrollTop = 0;
                // } else {
                //     var rowNumber = val.y/this.rowHeight;
                //     // console.log(rowNumber);
                //     var padding = 0; //rowNumber/2;
                //     //padding required cuz as the row number increases,
                //     // the tree gets more misaligned
                //     tbody.scrollTop = 40*rowNumber + padding;
                //     this.scrollFromTree = true;
                // }
                // var rowNumber = Math.round(val);
                // console.log("rowNumber"+ rowNumber);
                // var padding = 0;
                // tbody.scrollTop = 40*rowNumber + padding;
                // this.scrollFromTree = true;
            },
            handleScroll() {
                if(this.scrollFromTree) {
                    this.scrollFromTree = false;
                    return;
                }
                const thead = document.getElementById("myhead");
                const tbodyScroll = document.getElementById("mybody").scrollLeft;
                thead.scrollLeft = tbodyScroll;
                const scrollTop = document.getElementById("mybody").scrollTop;

                var rowNumber = scrollTop/this.rowHeight;
                rowNumber = Math.round(rowNumber);
                var geneId = this.stateTreeData[rowNumber]["Gene ID"];
                var scroll = {i: rowNumber, id: geneId};
                this.stateSetTableScroll(scroll);
            },
            handleMouseOver(d, i) {
                // d3.select(this).style({
                //     "background-color": "orange"
                // });
            }
        },
        mounted: function () {
            if(this.stateTreeData) {
                this.update();
            }
            const tbody = document.getElementById("mybody");
            tbody.addEventListener('scroll', _.throttle(this.handleScroll, 100));
        },
        created: function () {
            const tbody = document.getElementById("mybody");
            // tbody.addEventListener('scroll', this.handleScroll);
        },
        destroyed: function () {
            window.removeEventListener('scroll', this.handleScroll);
        }
    }

</script>
<style>
    #parent {
        position: absolute;
        left: 1vw;
        top: 6vh;
        width: 90%;
        height: 800px;
        overflow: hidden;
    }

    table {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        height: 800px;
        border: 0px solid #9CC255;
        border-collapse: collapse;
        overflow: hidden;
        /* Use this to create a "dead" area color if table is too wide for cells */
        background-color: #d6daeb;
        font-size: 14px;
        font-family: sans-serif;
    }

    .popupTable {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 400px;
        height: 200px;
    }

    .popupTable th {
        width: 30px;
    }

    thead {
        /*
        Grow thead automatically to fit content, don't shrink it
        proportionately to the body.
        */
        flex: 0 0 auto;
        display: block;
        /* x-scrolling will be managed via JS */
        overflow-x: hidden;
        /*
        Keep header columns aligned with useless scrollbar.
        For IE11, use "dead area" color to hide scrollbar functions
        */
        overflow-y: scroll;
        scrollbar-base-color: #ccc;
        scrollbar-face-color: #ccc;
        scrollbar-highlight-color: #ccc;
        scrollbar-track-color: #ccc;
        scrollbar-arrow-color: #ccc;
        scrollbar-shadow-color: #ccc;
        scrollbar-dark-shadow-color: #ccc;
    }

    /*
    For Webkit, use "dead area" color to hide scrollbar functions
    TODO: on Chrome/Safari for Mac, scrollbars are not shown anyway and
    this creates an extra block. No impact on iOS Safari.
    */
    thead::-webkit-scrollbar { display: block; background-color: #ccc; }
    thead::-webkit-scrollbar-track { background-color: #ccc; }

    /* Scroll the actual tbody (second child on all browsers) */
    tbody {
        display: block;
        overflow: scroll;
    }

    /* IE11 adds an extra tbody, have to hide it */
    tbody:nth-child(3) { display: none; }

    /* The one caveat, a hard-set width is required. */
    td, th {
        width: 200px;
        min-width: 200px;
        max-width: 200px;
        height: 40px;
        min-height: 40px;
        max-height: 40px;
        overflow: hidden;
        text-overflow: clip;
        white-space: nowrap;
        padding: 5px;
        border: 1px solid #f1f1f0;
    }

    /*th#anno {*/
        /*width: 100px;*/
        /*min-width: 100px;*/
        /*max-width: 100px;*/
    /*}*/

    tr:nth-child(even) {
        background-color: #d6daeb;
    }
    tr:nth-child(odd) {
        background-color: #eceef6;
    }

    th {
        background-color: #e1e7f3;
    }

    td:first-child,
    th:first-child {
        width: 200px;
        min-width: 200px;
        max-width: 200px;
        position: sticky;
        position: -webkit-sticky;
        left:0;
        box-shadow: 5px 0 2px -2px #f1f1f0;
        background-color: #d6daeb;
    }

    .anno_circle {
        r: 8;
        fill: #ff0;
        stroke: steelblue;
        stroke-width: 2px;
    }
</style>