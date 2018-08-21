<template>
    <g>
        <circle r="10" @click="clickNode"></circle>
        <text dy=".35em" :x="textPosn" y=-12>{{content.data.name}}</text>
    </g>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        name: "treenode",
        props: ["content"],
        data() {
            return {
                nodeId: "id",
                duration: 750,
                textPosn: 13,
                el: null
            }
        },
        mounted() {
            // this.bus.$on('exit', this.onExit)
            if(this.content != null) {
                this.el = d3.select(this.$el);
                this.renderNode();
            }

        },
        beforeDestroy() {
        },
        computed: {
        },
        methods: {
            renderNode() {
                this.el.attr("transform", d => {
                    return "translate(" + this.content.y0 + "," + this.content.x0 + ")";
                });

                this.el.transition().duration(this.duration)
                    .attr("transform", d => {
                        return "translate(" + this.content.y + "," + this.content.x + ")";
                    });
            },
            clickNode() {
                this.content = this.toggleChildren(this.content);
                this.changeFill();
                this.$emit('clicknode', this.content);
            },
            toggleChildren(d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else if (d._children) {
                    d.children = d._children;
                    d._children = null;
                }
                return d;
            },
            changeFill() {
                var el = d3.select(this.$el);
                el.select('circle')
                    .style("fill", d=> {
                        return this.content._children ? "black" : "#fff";
                    });
            },
            getTextPosn() {
                if(!this.content) return 13;
                return this.content._children ? -13 : 13;
            },
            onExit(node) {
                console.log("ON Exit ", node);
                this.el.select('circle')
                    .transition().duration(this.duration)
                    .attr('r', 1e-6);
                this.el.transition().duration(this.duration)
                    .attr("transform", d => {
                        return "translate(" + node.y + "," + node.x + ")";
                    })
                    .remove();
            }
        },
        watch: {
            content: {
                handler: function (val, oldVal) {
                   console.log(val);
                    this.renderNode();
                }
            }
        }
    }
</script>

<style scoped>
    circle {
        stroke: steelblue;
        stroke-width: 2px;
        fill: #fff;
        cursor: pointer;
    }
</style>