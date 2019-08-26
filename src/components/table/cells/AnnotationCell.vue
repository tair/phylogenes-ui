<template>
    <svg :width=tdWidth :height=tdHeight>
        <g> 
            <circle class="anno_circle"
                    cx="100" cy="18"></circle>
        </g>
    </svg>
</template>

<script>
    import * as d3 from 'd3';
    export default {
        name: "cell-annotation",
        props: ["content"],
        watch: {
            content: {
                handler: function (val, oldVal) {
                }
            }
        },
        mounted() {
            
        },
        data() {
            return {
                tdWidth: '190px',
                tdHeight: '30px',
            }
        },
        methods: {
            
        }
    }
</script>
<style scoped> 
    .anno_circle {
        r: 8;
        fill: #ff0;
        stroke: steelblue;
        stroke-width: 2px;
    }
</style>