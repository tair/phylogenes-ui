<template>
    <g>
        <path></path>
    </g>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        name: "treelink",
        props: ["content"],
        data() {
            return {
                nodeId: "id",
                duration: 750,
                el: null
            }
        },
        mounted() {
            if(this.content != null) {
                // console.log(this.content);
                this.el = d3.select(this.$el);
                this.renderLink();
            }
        },
        beforeDestroy() {
        },
        computed: {
        },
        methods: {
            renderLink() {
                this.el.select('path').attr('d', d => {
                    var o = {x: this.content.x0, y: this.content.y0}
                   return this.diagonal(o, o);
                });
                this.el.select('path')
                    .transition().duration(this.duration)
                    .attr('d', d => {
                        return this.diagonal(this.content, this.content.parent)
                    });
            },
            getPath() {
                return this.diagonal(this.content, this.content.parent);
            },
            diagonal(s, d) {
                var log = "M" + s.y + "," + s.x
                    + "C" + (s.y + d.y) / 2 + "," + s.x
                    + " " + (s.y + d.y) / 2 + "," + d.x
                    + " " + d.y + "," + d.x;
                return log;
            },
            onExit(node) {
                // console.log("On exit ", node.x, node.y);
                this.el.select('path')
                    .transition().duration(this.duration)
                    .attr('d', d => {
                        var o = {x: node.x, y: node.y};
                        return this.diagonal(o, o);
                    });
            }
        },
        watch: {
            content: {
                handler: function (val, oldVal) {
                    console.log(val);
                    // this.renderNode();
                }
            }
        }
    }
</script>

<style scoped>
    path {
        fill: none;
        stroke: steelblue;
        stroke-width: 5;
    }
</style>