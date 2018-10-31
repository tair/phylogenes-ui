<template>
    <div id="parent">
        <table>
            <thead id="myhead">
                <tr>

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

    export default {
        name: "tablelayout",
        components: {

        },
        data() {
            return {
                scrollVertical: true,
                tableBody: null,
                index: 0,
                rowHeight: 40,
                scrollFromTree: false
            }
        },
        computed: {
            ...mapGetters({
                stateTreeData: types.TREE_GET_DATA,
                stateTreeZoomX: types.TREE_GET_ZOOM
            })
        },
        watch: {
            stateTreeData: {
                handler: function (val, oldVal) {
                    this.update();
                }
            },
            stateTreeZoomX: {
                handler: function (val, oldVal) {
                    // this.rowHeight = 40;
                    // this.rowHeight = this.rowHeight * val.k;
                    this.setScroll(val);
                    // this.setPadding(val);
                    // this.update();
                },
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
                var t_head = table_d3.select('thead');
                const updateTh = t_head.select('tr')
                                        .selectAll('th')
                                        .data(titles);

                const enterTh = updateTh.enter()
                                    .append("th");

                updateTh.merge(enterTh)
                        .text(d => d);

                // const exitTh = updateTh.exit();
                // exitTh.transition().duration(1000)
                // .style("opacity", 0)
                // .remove();
            },
            renderTableBody(table_d3) {
                var titles = d3.keys(this.stateTreeData[0]);
                // console.log(titles);
                var t_body = table_d3.select('tbody');
                //Maps all the tree data into it's own rows.
                // console.log(this.stateTreeData);
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

                // console.log(rows_entering);
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
                td_entering = td_entering.append('td');

                td_rows_map = td_rows_map.merge(td_entering);
                td_rows_map = td_rows_map
                                .attr('data-th', d => d.name)
                                .text(d => d.value)
                                .attr('class','my-col');

                rows_exiting.transition().duration(500)
                        .style("opacity", 0)
                        .remove();
            },
            setScroll(val) {
                const tbody = document.getElementById("mybody");
                if(val.y > 0) {
                    tbody.scrollTop = 0;
                } else {
                    var rowNumber = -val.y/this.rowHeight;
                    var padding = rowNumber/2;
                    //padding required cuz as the row number increases,
                    // the tree gets more misaligned
                    tbody.scrollTop = 40*rowNumber + padding;
                    this.scrollFromTree = true;
                }
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
            }
        },
        mounted: function () {
            if(this.stateTreeData) {
                this.update();
            }
            const tbody = document.getElementById("mybody");
            tbody.addEventListener('scroll', _.throttle(this.handleScroll, 1000));
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
        width: 48vw;
        height: 75vh;
        overflow: hidden;
    }

    table {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        height: 840px;
        border: 2px solid #9CC255;
        border-collapse: collapse;
        overflow: hidden;
        /* Use this to create a "dead" area color if table is too wide for cells */
        background-color: #d6efb5fc;
        font-size: 14px;
        font-family: sans-serif;
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
        width: 300px;
        min-width: 300px;
        max-width: 300px;
        height: 40px;
        min-height: 40px;
        max-height: 40px;
        overflow: hidden;
        text-overflow: clip;
        white-space: nowrap;
        padding: 5px;
        border: 1px solid #9CC255;
        background-color: white;
    }

    th {
        background-color: #d6efb5fc;
    }

    td:first-child,
    th:first-child {
        width: 250px;
        min-width: 250px;
        max-width: 250px;
        position: sticky;
        position: -webkit-sticky;
        left:0;
        box-shadow: 5px 0 2px -2px #888;
    }
</style>