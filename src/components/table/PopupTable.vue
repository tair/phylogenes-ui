<template>
    <div>
        <table class="popupTable">
            <thead id="head">
                <tr>
                    <th v-for="col in cols">{{col}}</th>
                </tr>
            </thead>
            <tr v-for="a in data">
                <td>{{a.goTerm}}</td>
                <td>{{a.code}}</td>
                <td><a v-for="ref in a.reference" v-bind:href="ref.link">{{ref.count}}, </a></td>
                <td><a v-for="wf in a.withFrom" v-bind:href="wf.link">{{wf.name}},</a></td>
                <td><a v-bind:href="a.sourceLink">{{a.source}}</a></td>
            </tr>
        </table>
    </div>
</template>
<script>
    export default {
        name: "popupTable",
        props: ['cols', 'data'],
        watch: {
            cols: {
                handler: function (val, oldVal) {
                    this.cols = val;
                }
            }
        },
        mounted() {

        },
        data() {
            return {

            }
        },
    }
</script>
<style scoped>
    .popupTable {
        display: flex;
        flex-direction: column;
        flex: 1 1 auto;
        width: 100%;
        height: 200px;
        overflow: scroll;
    }

    .popupTable th {
        width: 100px;
        min-width: 100px;
        max-width: 100px;
        height:40px;
        max-height: 100px;
        word-wrap: break-word;
        white-space: normal;
        background-color: #c5dcf0;
        box-shadow: 2px 0 2px -2px #f1f1f0;
        text-align: center;
    }

    .popupTable td {
        width: 100px;
        min-width: 100px;
        max-width: 100px;
        word-wrap: break-word;
        white-space: normal;
        box-shadow: 2px 0 2px -2px #f1f1f0;
        padding-left: 5px;
        padding-top: 5px;
    }
</style>


