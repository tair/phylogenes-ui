<template>
    <div id="parent">
        <table class="mainTable">
            <thead>
                <tr>
                    <th v-for="col in cols">{{col}}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="entry in data">
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

    export default {
        name: "tablelayout2",
        data() {
            return {
                cols: [],
                data: [],
                tdWidth: '190px',
                tdHeight: '30px'
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
        },
        mounted: function () {
            if (this.stateTreeData) {
                this.update();
            }
        },
        methods: {
            update() {
                var titles = d3.keys(this.stateTreeData[0]);
                titles = titles.splice(1);
                this.cols = titles;
                this.data = this.stateTreeData;
            }
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
        background-color: #d6daeb;
        font-size: 14px;
        font-family: sans-serif;
    }
    .mainTable thead {
        display: block;
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
    .mainTable th {
        background-color: #e1e7f3;
    }
    .mainTable th, .mainTable td {
        /*background-color: #e1e7f3;*/
        min-width: 200px;
        width: 200px;
        max-width: 200px;
        min-height: 35px;
        max-height: 35px;

        border: 1px solid #f1f1f0;
        /*box-shadow: 5px 0 2px -2px #f1f1f0;*/

        word-wrap: break-word;
    }
    .mainTable td:first-child,
    .mainTable th:first-child {
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

