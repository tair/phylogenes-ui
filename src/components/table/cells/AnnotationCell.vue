<template>
  <svg :width="tdWidth" :height="tdHeight">
    <g>
      <!-- <circle class="anno_circle" cx="25" cy="18" r="8"></circle> -->
      <image
        v-if="content.symbol == 'flask'"
        xlink:href="/flask-yellow-transparent.png"
        height="20"
        width="20"
        x="15"
        y="6"
      />
      <image
        v-if="content.symbol == 'tree'"
        xlink:href="/IBA-transparent.png"
        height="35"
        width="35"
        x="8"
        y="-2"
      />
    </g>
  </svg>
</template>

<script>
import * as d3 from 'd3'
export default {
  name: 'cell-annotation',
  props: ['content'],
  data() {
    return {
      el: null
    }
  },
  watch: {
    content: {
      handler: function(val, oldVal) {}
    }
  },
  mounted() {
    this.el = d3.select(this.$el)
  },
  data() {
    return {
      tdWidth: '190px',
      tdHeight: '30px'
    }
  },
  methods: {}
}
</script>
<style scoped>
.anno_circle {
  fill: #ff0;
  stroke: steelblue;
  stroke-width: 2px;
}
</style>
