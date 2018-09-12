<template>
    <g>
        <circle :r="radius" @click="clickNode"></circle>
        <text dy=".35em" :x="textPosn" y=-12>{{content.text}}</text>
    </g>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        name: "dragnode",
        props: ["content"],
        data() {
            return {
                nodeId: "id",
                duration: 750,
                textPosn: 13,
                radius: 15,
                d3_circle: null,
                el: null
            }
        },
        mounted() {
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
                if(!this.content.enterLink) {
                    this.el.select('text')
                        .style('opacity', 1);
                } else {
                    this.el.select('text')
                        .style('opacity', 0);
                }

                this.d3_circle = this.el.select('circle');
                this.resetPosition();

                // this.el.attr("transform", d => {
                //     return "translate(" + this.content.yo + "," + this.content.xo + ")";
                // });
                //
                // this.el.transition().duration(this.duration)
                //     .attr("transform", d => {
                //         return "translate(" + this.content.y + "," + this.content.x + ")";
                //     });
                this.el.select('text')
                    .transition().duration(this.duration)
                    .style('opacity', 1);

                // this.el.call(this.setDragListener());
                var self = this;
                this.d3_circle.call(
                    d3.drag()
                        .on("drag", function(d) {
                            d[0] = d3.event.x, d[1] = d3.event.y;
                            d3.select(this)
                                .attr("cx", function(d) { return d[0]; })
                                .attr("cy", function(d) { return d[1]; });
                            self.el.select('text').attr("transform", d => {
                                return "translate(" + d3.event.x + "," + d3.event.y + ")";
                            });
                            // console.log(self.d3_circle.datum());
                            self.$emit("dragging", self.d3_circle.datum());
                        })
                        .on("end", function(d) {
                            self.$emit("dragend");
                        })
                );
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
            changeFill(flag) {
                var el = d3.select(this.$el);
                var fill = "red";
                if(flag)  {
                    fill = "grey";
                }
                el.select('circle')
                    .style("fill", d=> {
                        return fill;
                    });
            },
            getTextPosn() {
                if(!this.content) return 13;
                return this.content._children ? -13 : 13;
            },
            onExit(node) {
                // console.log("ON Exit ", node);
                this.el.select('circle')
                    .transition().duration(this.duration)
                    .attr('r', 1e-6);
                this.el.select('text')
                    .transition().duration(this.duration)
                    .style('opacity', 0);
                this.el.transition().duration(this.duration)
                    .attr("transform", d => {
                        return "translate(" + node.y + "," + node.x + ")";
                    });
            },
            setDragListener() {
                return d3.drag()
                    .on("start", (d) => {
                        this.changeFill(true);
                    })
                    .on("drag", () => {
                        // console.log(d3.event.dx);
                        this.content.x = this.content.x + d3.event.dx;
                        this.content.y = this.content.y + d3.event.dy;
                        this.el.attr("transform", d => {
                            return "translate(" + this.content.x + "," + this.content.y + ")";
                        });
                        this.$emit('clicknode', this.content);

                    })
                    .on("end", () => {
                        // console.log(this.el.node());
                        this.changeFill(false);
                    });
            },
            onIntersect(flag) {
                this.changeFill(flag);
            },
            resetPosition() {
                this.d3_circle
                    .datum([this.content.x, this.content.y, this.radius]);

                this.el.select('text')
                    .attr("transform", d => {
                        return "translate(" + this.content.x + "," + this.content.y + ")";
                    });

                this.d3_circle
                    .transition().duration(this.duration)
                    .attr("cx", this.content.x)
                    .attr("cy", this.content.y);

                this.el.select('text')
                    .transition().duration(this.duration)
                    .attr("transform", d => {
                        return "translate(" + this.content.x + "," + this.content.y + ")";
                    });
            }
        },
        watch: {
            content: {
                handler: function (val, oldVal) {
                   // console.log(val);
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
        fill: red;
        cursor: pointer;
    }
</style>