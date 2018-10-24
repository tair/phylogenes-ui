//BaseTreeNode should handle all the methods common
across all treenode types (eg. translate, exit movement).
<template>
    <g>
        <baseTxtNode v-if="!content.hideText" ref= "txtCom"
                     :content="content"></baseTxtNode>
        <component
                :is="nodeComponent"
                ref="myCom"
                :content="content"
                @clicked="onClick"
        >

        </component>
    </g>

</template>

<script>
    import * as d3 from 'd3';
    import baseTxtNode from '../nodes/text/BaseTextNode';
    import nodeCircle from '../nodes/NodeCircle';
    import nodeDiamond from '../nodes/NodeDiamond';
    import nodeTriangle from '../nodes/NodeTriangle';

    export default {
        name: "base-node",
        props: ["content"],
        components: {
            nodeCircle: nodeCircle,
            nodeDiamond: nodeDiamond,
            nodeTriangle: nodeTriangle,
            baseTxtNode: baseTxtNode
        },
        data() {
            return {
                duration: 750
            }
        },
        mounted() {
            this.el = d3.select(this.$el);
            this.renderNode();
        },
        computed: {
            nodeComponent: function () {
                // console.log("Current: ", this.content.type);
                return 'node-' + this.content.type.toLowerCase();
            },
            textComponent() {
                return 'node-text';
            }
        },
        methods: {
            onClick() {
                this.content = this.toggleChildren(this.content);
                this.$emit('clicknode', this.content);
            },
            onExit(node) {
                // console.log("ON Exit ", node);
                this.el.transition().duration(this.duration)
                    .attr("transform", d => {
                        return "translate(" + node.y + "," + node.x + ")";
                    });
                this.$refs.myCom.onExit(node);
                if(this.$refs.txtCom) {
                    this.$refs.txtCom.onExit(node);
                }
            },
            renderNode() {
                // console.log(this.el);
                //Position
                this.el.attr("transform", d => {
                    return "translate(" + this.content.yo + "," + this.content.xo + ")";
                });
                this.el.transition().duration(this.duration)
                    .attr("transform", d => {
                        return "translate(" + this.content.y + "," + this.content.x + ")";
                    });
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
            }
        }
    }
</script>