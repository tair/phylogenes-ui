<template>
    <div class="align-middle">
        <table class="popupTable">
            <thead id="head">
                <tr>
                    <th v-for="(col,i) in cols" :key="i"
                        :style="getStyle(i)">
                        <span v-if="!col.type">{{col}}</span>
                        <input v-if="col.type=='checkbox'" v-model="col.val" @click="checkall(col.val)"
                               type="checkbox" id="defaultCheckHeader">
                    </th>
                </tr>
            </thead>
            <tr v-for="row in data">
                <td v-for="(cell, i) in row" :style="getStyle(i)" :key="i">
                    <span v-if="!cell.type">{{cell}}</span>
                    <span v-if="cell.type=='text'">{{cell.val}}</span>
                    <!--If Cell type is 'link', render a single hyperlink-->
                    <a v-if="cell.type=='link'" v-bind:href="cell.link" target="_blank">{{cell.text}}</a>
                    <!--If Cell type is 'links', render multiple hyperlinks-->
                    <a v-if="cell.type=='links'"
                       v-for="(ref, i) in cell.links" v-bind:href="ref.link" :key="i" target="_blank">{{ref.text}}<span v-if="i != cell.links.length - 1">,</span>
                    </a> 
                    <div v-if="cell.type=='checkbox'" class="form-check">
                        <input type="checkbox" v-model="cell.checked" id="defaultCheck1">
                    </div>
                </td>
            </tr>
        </table>
    </div>
</template>
<script>
    export default {
        name: "popupTableOrganism",
        props: ['cols', 'data'],
        watch: {
            cols: {
                handler: function (val, oldVal) {
                    this.cols = val;
                }
            },
            config: {
                handler: function (val, oldVal) {
                    console.log(val);
                }
            }
        },
        mounted() {
            
        },
        data() {
            return {
                
            }
        },
        methods: {
            uncheckAll() {
                this.$emit("uncheck-all");
            },
            checkall(val) {
                if(!val) {
                    this.$emit("check-all");
                } else {
                    this.$emit("uncheck-all");
                }
            },
            getStyle(i) {
                if(i == 1) {
                    return "width: 300px";
                } else {
                    return "width: 100px";
                }
            }
        }
    }
</script>
<style scoped>
    .popupTable {
        display: block;
        margin: 0px auto;
        overflow: scroll;
        height: auto;
        width: 400px;
        max-width: 400px;
        max-height: 400px;
    }

    .popupTable th {
        width: 100px;
        height:40px;
        max-height: 100px;
        word-wrap: break-word;
        white-space: normal;
        background-color: #c5dcf0;
        box-shadow: 2px 0 2px -2px #f1f1f0;
        padding-left: 5px;
    }

    .popupTable td {
        width: 100px;
        word-wrap: break-word;
        white-space: normal;
        box-shadow: 2px 0 2px -2px #f1f1f0;
        padding-left: 5px;
        padding-top: 5px;
    }
</style>


