<template>
    <div class="align-middle">
        <table class="popupTable">
        <!-- add table content here -->
        </table>
    </div>
</template>
<script>
    export default {
        name: "popupTablePublication",
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
            console.log(this.cols);
            console.log(this.data);
        },
        data() {
            return {
                
            }
        },
        methods: {
            getStyle(i) {
                if(i == 0) {
                    return "width: 200px";
                } else if (i == 1) {
                    return "width: 100px";
                } else {
                    return "width: 700px";
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
        width: 1000px;
        max-width: 1000px;
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
        padding-bottom: 10px;
    }
</style>