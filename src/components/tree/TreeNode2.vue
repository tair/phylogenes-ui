<template>
  <g>
    <circle r="12" @click="clickNode"></circle>
    <text dy=".35em" :x="textPosn" y="12">{{ content.text }}</text>
  </g>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'treenode2',
  props: ['content'],
  data() {
    return {
      nodeId: 'id',
      duration: 750,
      textPosn: 13,
      el: null,
    }
  },
  mounted() {
    if (this.content != null) {
      this.el = d3.select(this.$el)
      this.renderNode()
    }
  },
  beforeDestroy() {},
  computed: {},
  methods: {
    renderNode() {
      if (this.content.children == null) {
        this.changeFill()
      }
      if (!this.content.enterLink) {
        this.el.select('text').style('opacity', 1)
      } else {
        this.el.select('text').style('opacity', 0)
      }
      this.el.attr('transform', (d) => {
        return 'translate(' + this.content.yo + ',' + this.content.xo + ')'
      })

      this.el
        .transition()
        .duration(this.duration)
        .attr('transform', (d) => {
          return 'translate(' + this.content.y + ',' + this.content.x + ')'
        })
      this.el
        .select('text')
        .transition()
        .duration(this.duration)
        .style('opacity', 1)
    },
    clickNode() {
      this.content = this.toggleChildren(this.content)
      this.changeFill()
      this.$emit('clicknode', this.content)
    },
    toggleChildren(d) {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else if (d._children) {
        d.children = d._children
        d._children = null
      }
      return d
    },
    changeFill() {
      var el = d3.select(this.$el)
      el.select('circle').style('fill', (d) => {
        return this.content._children ? 'black' : '#fff'
      })
    },
    getTextPosn() {
      if (!this.content) return 13
      return this.content._children ? -13 : 13
    },
    onExit(node) {
      // console.log("ON Exit ", node);
      this.el
        .select('circle')
        .transition()
        .duration(this.duration)
        .attr('r', 1e-6)
      this.el
        .select('text')
        .transition()
        .duration(this.duration)
        .style('opacity', 0)
      this.el
        .transition()
        .duration(this.duration)
        .attr('transform', (d) => {
          return 'translate(' + node.y + ',' + node.x + ')'
        })
    },
  },
  watch: {
    content: {
      handler: function (val, oldVal) {
        // console.log(val);
        this.renderNode()
      },
    },
  },
}
</script>

<style scoped>
circle {
  stroke: red;
  stroke-width: 2px;
  fill: #fff;
  cursor: pointer;
}
</style>
