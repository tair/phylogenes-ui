<template>
    <g class="shape">
        <path v-if="!hideShape" class="triangle" :d="triangleSymbol()"
              :transform="rotate()"
              @click.stop.prevent="onClick"></path>
    </g>
</template>

<script>
    import * as d3 from 'd3';
    import nodeText from './text/TextOfNode';

    export default {
        name: "node-triangle",
        props: ["content"],
        watch: {
            content: {
                handler: function (val, oldVal) {
                    // console.log(val);
                    // this.renderNode();
                }
            }
        },
        components: {
            nodeText: nodeText
        },
        data() {
            return {
                el: null,
                duration: 750,
                hideShape: false,
                hideText: false
            }
        },
        mounted() {
            if(this.content != null) {
                // console.log(this.content.type);
                this.el = d3.select(this.$el);
                this.hideShape = this.content.hideShape;
                this.hideText = this.content.hideText;
                this.renderNode();
            }
        },
        computed: {

        },
        methods: {
            onClick() {
                // console.log("Clicked");
                // this.content = this.toggleChildren(this.content);
                // this.changeFill();
                this.$emit('clicked', this.content);
            },
            renderNode() {
                //Appearance
            },
            onExit(node) {
                // console.log("ON Exit ", node);
                // this.el.select('path')
                //     .transition().duration(this.duration)
                //     .attr('r', 1e-6);
                this.el.transition().duration(this.duration)
                    .style('opacity', 0);
                // this.el.transition().duration(this.duration)
                //     .attr("transform", d => {
                //         return "translate(" + node.y + "," + node.x + ")";
                //     });
            },
            triangleSymbol() {
                var symbolGenerator = d3.symbol()
                    .size([300]);

                symbolGenerator
                    .type(d3.symbolTriangle);

                return symbolGenerator();
            },
            rotate() {
                return "rotate(-90)";
            }
        }
    }
</script>
<style scoped>
    .triangle {
        stroke: white;
        stroke-width: 0px;
        fill: grey;
        cursor: pointer;
    }
</style>