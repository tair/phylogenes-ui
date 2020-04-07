<template>
  <g @contextmenu.prevent="openMenu($event)">
    <circle v-if="isCircle" :r="radius" @click="clickNode"></circle>
    <path
      v-if="isDiamond"
      class="diamond"
      :d="diamondSymbol()"
      fill="red"
    ></path>
    <text dy=".35em" :x="textPosn" y="-10">{{ content.text }}</text>
  </g>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'treenode',
  props: ['content'],
  data() {
    return {
      nodeId: 'id',
      duration: 750,
      radius: 12,
      textPosn: 18,
      isCircle: true,
      isDiamond: false,
      el: null,
    }
  },
  mounted() {
    if (this.content != null) {
      this.el = d3.select(this.$el)

      if (this.content.type === 'Diamond') {
        this.isCircle = false
        var symbolGenerator = d3.symbol().size([400])

        this.el
          .append('path')
          .attr('d', function (d) {
            symbolGenerator.type(d3.symbolDiamond)

            return symbolGenerator()
          })
          .style('fill', this.content.fillColor)
          .style('stroke', 'white')
          .style('stroke-width', '2px')
          .style('cursor', 'pointer')
          .on('click', this.clickNode)
      } else if (this.content.type === 'None') {
        this.isCircle = false
      }

      this.renderNode()
    }
  },
  beforeDestroy() {},
  computed: {},
  methods: {
    openMenu(evt) {
      this.$parent.$refs.menu.open(evt, this.content.id)
    },
    renderNode() {
      this.setFill()
      if (this.content._children) {
        this.changeFill()
      }

      if (!this.content.enterLink) {
        this.el.select('text').style('opacity', 1)
      } else {
        this.el.select('text').style('opacity', 0)
        this.el
          .select('text')
          .transition()
          .duration(this.duration)
          .style('opacity', 1)
      }

      if (this.content.enterLink) {
      }
      // console.log("Id: " + this.content.id + " Yo: " + this.content.yo + " Y: " + this.content.y);
      // console.log("Id: " + this.content.id + " Xo: " + this.content.xo + " X: " + this.content.x);
      this.el.attr('transform', (d) => {
        return 'translate(' + this.content.yo + ',' + this.content.xo + ')'
      })
      this.el
        .transition()
        .duration(this.duration)
        .attr('transform', (d) => {
          return 'translate(' + this.content.y + ',' + this.content.x + ')'
        })
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
    setFill() {
      var el = d3.select(this.$el)
      el.select('circle').style('fill', (d) => {
        return this.content.fillColor ? this.content.fillColor : '#fff'
      })
    },
    changeFill() {
      var el = d3.select(this.$el)
      el.select('circle').style('fill', (d) => {
        return this.content._children ? 'grey' : '#fff'
      })
    },
    getTextPosn() {
      if (!this.content) return 14
      return this.content._children ? -14 : 14
    },
    onExit(node) {
      // console.log("ON Exit ", node);
      if (!node) {
        node = { x: this.content.x, y: this.content.y }
      }

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
  stroke: steelblue;
  stroke-width: 2px;
  fill: #fff;
  cursor: pointer;
}
text {
  font-size: 14px;
  font-family: 'sans-serif';
  font-weight: bold;
}
.diamond {
  stroke: white;
  stroke-width: 2px;
  fill: #1b2ad8;
  cursor: pointer;
}
</style>
