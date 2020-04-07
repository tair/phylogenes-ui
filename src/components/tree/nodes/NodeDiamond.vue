<template>
  <g class="shape">
    <path
      v-if="!hideShape"
      id="nodeDiamond"
      :d="diamondSymbol()"
      @click.stop.prevent="onClick"
    ></path>
  </g>
</template>

<script>
import * as d3 from 'd3'
import nodeText from './text/TextOfNode'

export default {
  name: 'node-diamond',
  props: ['content'],
  watch: {
    content: {
      handler: function (val, oldVal) {
        // console.log(val);
        this.renderNode()
      },
    },
  },
  components: {
    nodeText: nodeText,
  },
  data() {
    return {
      radius: 10,
      duration: 750,
      el: null,
      hideShape: false,
      hideText: false,
    }
  },
  mounted() {
    if (this.content != null) {
      // console.log(this.content.type);
      this.el = d3.select(this.$el)
      this.hideShape = this.content.hideShape
      this.hideText = this.content.hideText
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
    diamondSymbol() {
      var symbolGenerator = d3.symbol().size([150])

      symbolGenerator.type(d3.symbolDiamond)

      return symbolGenerator()
    },
  },
}
</script>
<style scoped>
#nodeDiamond {
  stroke: white;
  stroke-width: 0px;
  fill: #0000ff;
  cursor: pointer;
}
</style>
