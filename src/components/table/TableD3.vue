<template>
    <div id="table-view">
        <table id="onlyHeader">
            <thead>
                <tr></tr>
            </thead>
        </table>
        <table id="orig">
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
                table: null,
                tableDup: null,
                i: 0,
                rowHeight: 40,
                marginTopY: 120,
                paddingTopY: 0,
                scrollTop: 50
            }
        },
        methods: {
            renderTableHeaders(table) {
                var titles = d3.keys(this.stateTreeData[0]);
                //console.log(titles);

                const updateTh = table.select('thead').select('tr')
                    .selectAll('th')
                    .data(titles);
                const enterTh = updateTh.enter()
                    .append("th")
                    .style("min-width", function(d,i) {
                        if(i == 0) return "20px";
                        if(i == 1) return "230px";
                        if(i == 2) return "150px";
                        if(i == 3) return "230px";
                        if(i == 4) return "230px";
                        return "130px";
                    });
                const exitTh = updateTh.exit();

                //updateTh.call(this.dragResize);
                //merge
                const tr = updateTh.merge(enterTh)
                    .text(d => d);
                exitTh.transition().duration(1000)
                    .style("opacity", 0)
                    .remove();
            },
            update() {
                // var tableV = d3.select("table");
                // var scrollHeight = tableV.property("scrollHeight");
                // console.log(scrollHeight);

                this.table = d3.select('#table-view').select('#orig');
                this.tableDup = d3.select('#table-view').select('#onlyHeader');
                //this.table.style("scrollTop", 20);

                var marginTop = (this.marginTopY + this.paddingTopY - this.rowHeight)+"px";
                // this.table.transition().duration(500)
                //     .style("margin-top",marginTop);
                this.tableDup.transition().duration(500)
                    .style("margin-top",marginTop);

                // ~~~~~~~~~~~~~~~~~~~ Titles ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
                var titles = d3.keys(this.stateTreeData[0]);
                this.renderTableHeaders(this.table);

                this.renderTableHeaders(this.tableDup);
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

                const updateTr = this.table.select('tbody')
                    .selectAll('tr')
                    .data(this.stateTreeData);
                //console.log(updateTr);
                const enterTr = updateTr.enter().append('tr')
                    .style("opacity", 0);
                const exitTr = updateTr.exit();

                const updateTd = updateTr.merge(enterTr)
                    .selectAll('td')
                    .data(function (d) {
                        return titles.map(function (k) {
                            return { 'value': d[k], 'name': k};
                        });
                    });

                enterTr.transition().duration(1000)
                    .style("opacity", 1);

                const enterTd = updateTd.enter().append('td');
                const exitTd = updateTd.exit();

                var tdHeight = this.rowHeight + 'px';
                //merge
                const td = updateTd.merge(enterTd)
                    .attr('class', 'container')
                    .attr('data-th', d => d.name)
                    .style('height', tdHeight)
                    .on('drag', d => {
                        console.log("Dragging");
                    })
                    .text(d => d.value);

                exitTd.transition().duration(100).remove();
                exitTr.transition().duration(500)
                    .style("opacity", 0)
                    .remove();
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
                    //console.log(val.y);
                    var elmnt = document.getElementById("orig");

                    if(val.y > 0) {
                        this.paddingTopY = val.y;
                        elmnt.scrollTop = 0;
                    } else {
                        //console.log(elmnt.scrollTop);
                        this.paddingTopY = 0;
                        var treeBottomY = -val.y;
                        elmnt.scrollTop = treeBottomY;
                        var diff = treeBottomY - elmnt.scrollTop;
                        if(diff > 10) {
                            //console.log(this.paddingTopY);
                            this.paddingTopY = -diff;
                            //console.log(diff);
                        }
                        //console.log(elmnt.scrollTop);
                        //console.log(val.y);
                    }

                    //console.log(this.rowHeight);
                    this.update();
                },
            }
        },
        mounted() {

        },
    }
</script>

<style>
    #orig {
        display: block;
        width: 100%;
        height: 750px;
        border-collapse: collapse;
        margin-top: 0px;
        overflow-x: scroll;
        overflow-y: scroll;
    }
    #onlyHeader {
        border-collapse: collapse;
        display: block;
        width: 100%;
    }

    th {
        background-color: #333;
        color: white;
        font-weight: bold;
        cursor: s-resize;
        background-repeat: no-repeat;
        background-position: 3% center;
        height: 40px;
    }
    td, th {
        padding: 2px;
        border: 1px solid #ccc;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow:ellipsis;
    }
    td.container {
        width: 50px;
        cursor: pointer;
    }

</style>