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
    import * as types from '../../store/types_treedata';
    import { mapGetters } from 'vuex';

    export default {
        name: "tablelayout",
        components: {

        },
        data() {
            return {
                scrollVertical: true,
                tableBody: null,
                index: 0
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
            update() {
                this.tableBody = d3.select('table');
                this.renderTableHeader(this.tableBody);
                this.renderTableBody(this.tableBody);
            },
            // updateIds() {
            //     this.index = 0;
            //     this.stateTreeData.forEach(n => {
            //         n.id = this.index++;
            //     });
            // },
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
                    var treeBottomY = -val.y;
                    tbody.scrollTop = treeBottomY;
                }
            },
            handleScroll() {
                const thead = document.getElementById("myhead");
                const tbodyScroll = document.getElementById("mybody").scrollLeft;
                thead.scrollLeft = tbodyScroll;
            }
        },
        mounted: function () {
            const tbody = document.getElementById("mybody");
            tbody.addEventListener('scroll', this.handleScroll);
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
        height: 100%;
        border: 1px solid #ccc;
        border-collapse: collapse;
        overflow: hidden;
        /* Use this to create a "dead" area color if table is too wide for cells */
        background-color: #ccc;
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
        width: 20em;
        min-width: 20em;
        height: 4em;
        min-height: 2em;
        padding: 0.3em;
        border: 1px solid #ddd;
        background-color: white;
    }

    th {
        background-color: #f7f7f7;
    }

    td:first-child,
    th:first-child {
        position: sticky;
        position: -webkit-sticky;
        left:0;
    }
</style>



<!--<template>-->
    <!--<div id="table-view">-->
        <!--<table id="table-oh">-->
            <!--<thead>-->
                <!--<tr></tr>-->
            <!--</thead>-->
        <!--</table>-->
        <!--<table id="table-wh">-->
            <!--<tbody></tbody>-->
        <!--</table>-->
    <!--</div>-->
<!--</template>-->

<!--<script>-->
    <!--import * as d3 from 'd3';-->
    <!--import * as types from '../../store/types_treedata';-->

    <!--import { mapGetters } from 'vuex';-->

    <!--export default {-->
        <!--name: "tablelayout",-->
        <!--props: ["tableData"],-->
        <!--data() {-->
            <!--return {-->
                <!--selectedNode: null,-->
                <!--tableBody: null,-->
                <!--tableHeader: null,-->
                <!--i: 0,-->
                <!--rowHeight: 40,-->
                <!--marginTopY: 120,-->
                <!--paddingTopY: 0,-->
                <!--scrollTop: 50-->
            <!--}-->
        <!--},-->
        <!--methods: {-->
            <!--renderTableHeaders(table, colWidths) {-->
                <!--var titles = d3.keys(this.stateTreeData[0]);-->

                <!--const updateTh = table.select('thead').select('tr')-->
                    <!--.selectAll('th')-->
                    <!--.data(titles);-->
                <!--const enterTh = updateTh.enter()-->
                    <!--.append("th")-->
                    <!--.style("width", function(d,i) {-->
                        <!--var width = colWidths[i] + "px";-->
                        <!--return width;-->
                    <!--});-->
                <!--const exitTh = updateTh.exit();-->
                <!---->
                <!--//merge-->
                <!--const tr = updateTh.merge(enterTh)-->
                    <!--.text(d => d);-->
                <!--exitTh.transition().duration(1000)-->
                    <!--.style("opacity", 0)-->
                    <!--.remove();-->
            <!--},-->
            <!--renderTableBody(table_d3) {-->
                <!--var titles = d3.keys(this.stateTreeData[0]);-->

                <!--//Maps all the tree data into it's own rows.-->
                <!--var rows_d3_map = table_d3.select('tbody')-->
                    <!--.selectAll('tr')-->
                    <!--.data(this.stateTreeData);-->

                <!--if(rows_d3_map.length === 0) {-->
                    <!--console.log("No new entering nodes");-->
                    <!--return;-->
                <!--}-->
                <!--//All the rows which are new. At first load it's all the rows from data.-->
                <!--var rows_entering = rows_d3_map.enter();-->
                <!--var rows_exiting = rows_d3_map.exit();-->

                <!--//Modify the rows entering with appending html tags or modifying its style.-->
                <!--rows_entering = rows_entering.append('tr')-->
                    <!--.style("opacity", 0);-->
                <!--/*-->
                    <!--Here we append <tr> to <tbody> and add style. The html looks like this:-->
                    <!--<tbody>-->
                        <!--<tr style="opacity: 0"></tr>-->
                        <!--...-->
                        <!--...-->
                        <!--<tr style="opacity: 0"></tr>-->
                    <!--</tbody>-->
                 <!--*/-->

                <!--rows_entering.transition().duration(1000)-->
                    <!--.style("opacity", 1);-->
                <!--rows_exiting.transition().duration(500)-->
                    <!--.style("opacity", 0)-->
                    <!--.remove();-->

                <!--var tdHeight = this.rowHeight + 'px';-->

                <!--/*-->
                    <!--selection.merge(other)-->
                <!--Returns a new selection merging this selection with the specified other selection.-->
                <!--The returned selection has the same number of groups and the same parents as this selection.-->
                <!--commonly used to merge the enter and update selections after a data-join.-->
                <!--*/-->
                <!--var td_rows_map = rows_d3_map.merge(rows_entering);-->
                <!--td_rows_map = td_rows_map-->
                    <!--.selectAll('td')-->
                    <!--.data((d) => {-->
                        <!--return titles.map((k) => {-->
                            <!--return { 'value': d[k], 'name': k};-->
                        <!--});-->
                    <!--});-->

                <!--var td_entering = td_rows_map.enter();-->
                <!--td_entering = td_entering.append('td');-->

                <!--td_rows_map = td_rows_map.merge(td_entering);-->
                <!--td_rows_map = td_rows_map-->
                    <!--.attr('data-th', d => d.name)-->
                    <!--.text(d => d.value)-->
                    <!--.style('height', tdHeight);-->
            <!--},-->
            <!--getColWidths(table_d3) {-->
                <!--var widths = [];-->
                <!--//Select the first <tr> from the table-->
                <!--var selection = table_d3.select('tbody')-->
                    <!--.select('tr');-->

                <!--selection.each(function(d) {-->
                    <!--d3.selectAll(this.childNodes)-->
                        <!--.each(function(d) {-->
                            <!--widths.push(d3.select(this).node().getBoundingClientRect().width)-->
                        <!--});-->
                <!--});-->
                <!--return widths;-->
            <!--},-->
            <!--update() {-->
                <!--if(this.stateTreeData == null) return;-->

                <!--this.tableBody = d3.select('#table-view').select('#table-wh');-->
                <!--this.renderTableBody(this.tableBody);-->
                <!--// ~~~~~~~~~~~~~~~~~~~ Titles ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//-->
                <!--var colWidths = this.getColWidths(this.tableBody);-->
                <!--this.tableHeader = d3.select('#table-view').select('#table-oh');-->
                <!--this.renderTableHeaders(this.tableHeader, colWidths);-->
                <!--// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//-->

                <!--var marginTop = (this.marginTopY + this.paddingTopY - this.rowHeight)+"px";-->
                <!--this.tableHeader.transition().duration(500)-->
                    <!--.style("margin-top",marginTop);-->
            <!--},-->
            <!--setScroll(val) {-->
                <!--var elmnt = document.getElementById("table-wh");-->
                <!--if(elmnt == null) return;-->
                <!--if(val.y > 0) {-->
                    <!--elmnt.scrollTop = 0;-->
                <!--} else {-->
                    <!--var treeBottomY = -val.y;-->
                    <!--elmnt.scrollTop = treeBottomY;-->
                <!--}-->
            <!--},-->
            <!--setPadding(val) {-->
                <!--var elmnt = document.getElementById("table-wh");-->
                <!--if(elmnt == null) return;-->
                <!--if(val.y > 0) {-->
                    <!--this.paddingTopY = val.y;-->
                <!--} else {-->
                    <!--this.paddingTopY = 0;-->
                    <!--var treeBottomY = -val.y;-->
                    <!--elmnt.scrollTop = treeBottomY;-->
                    <!--var diff = treeBottomY - elmnt.scrollTop;-->
                    <!--if(diff > 10) {-->
                        <!--this.paddingTopY = -diff;-->
                    <!--}-->
                <!--}-->
            <!--}-->
        <!--},-->
        <!--computed: {-->
            <!--...mapGetters({-->
                <!--stateTreeData: types.TREE_GET_DATA,-->
                <!--stateTreeZoomX: types.TREE_GET_ZOOM-->
            <!--})-->
        <!--},-->
        <!--watch: {-->
            <!--stateTreeData: {-->
                <!--handler: function (val, oldVal) {-->
                    <!--this.update();-->
                <!--},-->
                <!--deep: true-->
            <!--},-->
            <!--stateTreeZoomX: {-->
                <!--handler: function (val, oldVal) {-->
                    <!--this.rowHeight = 40;-->
                    <!--this.rowHeight = this.rowHeight * val.k;-->
                    <!--this.setScroll(val);-->
                    <!--this.setPadding(val);-->
                    <!--this.update();-->
                <!--},-->
            <!--}-->
        <!--},-->
        <!--mounted() {-->
            <!--this.update();-->
        <!--},-->
    <!--}-->
<!--</script>-->

<!--<style>-->
    <!--/*Table without header*/-->
    <!--#table-wh {-->
        <!--display: block;-->
        <!--width: 100%;-->
        <!--height: 750px;-->
        <!--border-collapse: collapse;-->
        <!--margin-top: 0px;-->
        <!--overflow-x: scroll;-->
        <!--overflow-y: scroll;-->
    <!--}-->
    <!--/*Table Only display header*/-->
    <!--#table-oh {-->
        <!--border-collapse: collapse;-->
        <!--/*display: block;*/-->
        <!--width: 100%;-->
        <!--table-layout:fixed;-->
    <!--}-->

    <!--th {-->
        <!--background-color: #333;-->
        <!--color: white;-->
        <!--font-weight: bold;-->
        <!--cursor: s-resize;-->
        <!--height: 40px;-->
        <!--border: 1px solid #ccc;-->
    <!--}-->
    <!--td {-->
        <!--padding: 2px;-->
        <!--border: 1px solid #ccc;-->
        <!--text-align: left;-->
        <!--white-space: nowrap;-->
        <!--overflow: hidden;-->
        <!--text-overflow:ellipsis;-->
    <!--}-->

<!--</style>-->