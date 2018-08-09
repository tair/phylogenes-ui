<template>
    <div id="table-view">
        <table id="table-oh">
            <thead>
                <tr></tr>
            </thead>
        </table>
        <table id="table-wh">
            <tbody></tbody>
        </table>
    </div>
</template>

<script>
    import * as d3 from 'd3';
    import * as types from '../../store/types_treedata';

    import { mapGetters } from 'vuex';

    export default {
        name: "tablelayout",
        props: ["tableData"],
        data() {
            return {
                selectedNode: null,
                tableBody: null,
                tableHeader: null,
                i: 0,
                rowHeight: 40,
                marginTopY: 120,
                paddingTopY: 0,
                scrollTop: 50
            }
        },
        methods: {
            renderTableHeaders(table, colWidths) {
                var titles = d3.keys(this.stateTreeData[0]);

                const updateTh = table.select('thead').select('tr')
                    .selectAll('th')
                    .data(titles);
                const enterTh = updateTh.enter()
                    .append("th")
                    .style("width", function(d,i) {
                        var width = colWidths[i] + "px";
                        return width;
                    });
                const exitTh = updateTh.exit();
                
                //merge
                const tr = updateTh.merge(enterTh)
                    .text(d => d);
                exitTh.transition().duration(1000)
                    .style("opacity", 0)
                    .remove();
            },
            renderTableBody(table_d3) {
                var titles = d3.keys(this.stateTreeData[0]);

                //Maps all the tree data into it's own rows.
                var rows_d3_map = table_d3.select('tbody')
                    .selectAll('tr')
                    .data(this.stateTreeData);

                if(rows_d3_map.length === 0) {
                    console.log("No new entering nodes");
                    return;
                }
                //All the rows which are new. At first load it's all the rows from data.
                var rows_entering = rows_d3_map.enter();
                var rows_exiting = rows_d3_map.exit();

                //Modify the rows entering with appending html tags or modifying its style.
                rows_entering = rows_entering.append('tr')
                    .style("opacity", 0);
                /*
                    Here we append <tr> to <tbody> and add style. The html looks like this:
                    <tbody>
                        <tr style="opacity: 0"></tr>
                        ...
                        ...
                        <tr style="opacity: 0"></tr>
                    </tbody>
                 */

                rows_entering.transition().duration(1000)
                    .style("opacity", 1);
                rows_exiting.transition().duration(500)
                    .style("opacity", 0)
                    .remove();

                var tdHeight = this.rowHeight + 'px';

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
                    .style('height', tdHeight);
            },
            getColWidths(table_d3) {
                var widths = [];
                //Select the first <tr> from the table
                var selection = table_d3.select('tbody')
                    .select('tr');

                selection.each(function(d) {
                    d3.selectAll(this.childNodes)
                        .each(function(d) {
                            widths.push(d3.select(this).node().getBoundingClientRect().width)
                        });
                });
                return widths;
            },
            update() {
                if(this.stateTreeData == null) return;

                this.tableBody = d3.select('#table-view').select('#table-wh');
                this.renderTableBody(this.tableBody);
                // ~~~~~~~~~~~~~~~~~~~ Titles ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
                var colWidths = this.getColWidths(this.tableBody);
                this.tableHeader = d3.select('#table-view').select('#table-oh');
                this.renderTableHeaders(this.tableHeader, colWidths);
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

                var marginTop = (this.marginTopY + this.paddingTopY - this.rowHeight)+"px";
                this.tableHeader.transition().duration(500)
                    .style("margin-top",marginTop);
            },
            setScroll(val) {
                var elmnt = document.getElementById("table-wh");
                if(elmnt == null) return;
                if(val.y > 0) {
                    elmnt.scrollTop = 0;
                } else {
                    var treeBottomY = -val.y;
                    elmnt.scrollTop = treeBottomY;
                }
            },
            setPadding(val) {
                var elmnt = document.getElementById("table-wh");
                if(elmnt == null) return;
                if(val.y > 0) {
                    this.paddingTopY = val.y;
                } else {
                    this.paddingTopY = 0;
                    var treeBottomY = -val.y;
                    elmnt.scrollTop = treeBottomY;
                    var diff = treeBottomY - elmnt.scrollTop;
                    if(diff > 10) {
                        this.paddingTopY = -diff;
                    }
                }
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
                },
                deep: true
            },
            stateTreeZoomX: {
                handler: function (val, oldVal) {
                    this.rowHeight = 40;
                    this.rowHeight = this.rowHeight * val.k;
                    this.setScroll(val);
                    this.setPadding(val);
                    this.update();
                },
            }
        },
        mounted() {
            this.update();
        },
    }
</script>

<style>
    /*Table without header*/
    #table-wh {
        display: block;
        width: 100%;
        height: 750px;
        border-collapse: collapse;
        margin-top: 0px;
        overflow-x: scroll;
        overflow-y: scroll;
    }
    /*Table Only display header*/
    #table-oh {
        border-collapse: collapse;
        /*display: block;*/
        width: 100%;
        table-layout:fixed;
    }

    th {
        background-color: #333;
        color: white;
        font-weight: bold;
        cursor: s-resize;
        height: 40px;
        border: 1px solid #ccc;
    }
    td {
        padding: 2px;
        border: 1px solid #ccc;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow:ellipsis;
    }

</style>