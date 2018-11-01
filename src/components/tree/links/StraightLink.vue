<template>
    <g class="link" @mouseover="onMouseOver">
        <path></path>
    </g>
</template>
<script>
    import * as d3 from 'd3';

    export default {
        name: "link-straight",
        props: ["content"],
        watch: {
            content: {
                handler: function (val, oldVal) {
                    // console.log(val);
                    // this.renderLink();
                }
            }
        },
        data() {
            return {
                nodeId: "id",
                duration: 750,
                el: null
            }
        },
        components: {},
        mounted() {
            if(this.content != null) {
                // console.log(this.content);
                this.el = d3.select(this.$el);
                this.renderLink();
            }
        },
        beforeDestroy() {
        },
        methods: {
            renderLink() {
                if(!this.content.enterLink) {
                    this.el.select('path')
                        .attr('d', d => {
                            var d = {x: this.content.xo, y: this.content.yo};
                            var s = {x: this.content.parent.xo, y: this.content.parent.yo};
                            return this.diagonal(d, s);
                        });
                    this.el.select('path')
                        .transition().duration(this.duration)
                        .attr('d', d => {
                            return this.diagonal(this.content, this.content.parent)
                        });
                } else {
                    this.el.select('path').attr('d', d => {
                        var o = {x: this.content.parent.xo, y: this.content.parent.yo}
                        return this.diagonal(o, o);
                    });
                    this.el.select('path')
                        .transition().duration(this.duration)
                        .attr('d', d => {
                            return this.diagonal(this.content, this.content.parent)
                        });
                }
            },
            onExit(node) {
                if(!node) {
                    node = {x: this.content.x, y: this.content.y};
                }
                this.el.select('path')
                    .transition().duration(this.duration)
                    .attr('d', d => {
                        var o = {x: node.x, y: node.y};
                        return this.diagonal(o, o);
                    });
            },
            onMouseOver() {
                // console.log("Mouse Over");
            },
            diagonal(s, d) {
                // var log = "M" + s.y + "," + s.x
                //     + "C" + (s.y + d.y) / 2 + "," + s.x
                //     + " " + (s.y + d.y) / 2 + "," + d.x
                //     + " " + d.y + "," + d.x;
                var moveTo = "M"+ s.y + "," + s.x;
                var verticalLineTo = "V" + d.x;
                var horizontalLineto = "H" + d.y;
                var log = moveTo + horizontalLineto + verticalLineTo;
                // console.log(log);
                return log;
            },
        }
    }
    </script>

<style scoped>
    path {
        fill: none;
        stroke: steelblue;
        stroke-width: 1.5;
    },
    path:hover {
        cursor: pointer;
        stroke: orange
    }
</style>