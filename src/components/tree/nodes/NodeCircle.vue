<template>
  <g class="shape">
    <circle
      id="nodeCircle"
      v-if="!hideShape"
      :r="radius"
      @click.stop.prevent="onClick"
    ></circle>
  </g>
</template>

<script>
import * as d3 from 'd3'
import nodeText from './text/TextOfNode'
import baseNode from './BaseTreeNode'

export default {
  extends: baseNode,
  name: 'node-circle',
  props: ['content'],
  watch: {
    content: {
      handler: function (val, oldVal) {
        // console.log(val);
        // this.renderNode();
      },
    },
  },
  components: {
    nodeText: nodeText,
  },
  data() {
    return {
      radius: 5,
      duration: 750,
      el: null,
      hideShape: false,
      hideText: false,
    }
  },
  mounted() {
    if (this.content != null) {
      this.el = d3.select(this.$el)
      this.hideShape = this.content.hideShape
      this.hideText = this.content.hideText
      this.renderNode()
    }
  },
  computed: {},
  methods: {
    onClick() {
      // this.changeFill();
      this.$emit('clicked', this.content)
    },
    onExit(node) {
      this.el.transition().duration(this.duration).style('opacity', 0)
    },
    renderNode() {
      //Appearance
      this.setFill()
    },
    setFill() {
      this.el.select('circle').style('fill', (d) => {
        return this.content.fillColor ? this.content.fillColor : '#fff'
      })
    },
  },
}
</script>
<style scoped>
#nodeCircle {
  stroke: steelblue;
  stroke-width: 1px;
  fill: #fff;
  cursor: pointer;
}
</style>
