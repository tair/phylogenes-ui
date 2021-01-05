<template>
  <component :is="textComponent" ref="myCom" :content="content" @clicked="onTextClick"></component>
</template>
<script>
import * as d3 from 'd3'
import nodeText from './TextOfNode'

export default {
  name: 'base-txt-node',
  props: ['content'],
  components: {
    nodeText: nodeText,
  },
  data() {
    return {
      duration: 750,
      el: null,
    }
  },
  mounted() {
    // console.log("Here");
    if (this.content != null) {
      // console.log(this.content.type);
      this.el = d3.select(this.$el)
    }
  },
  computed: {
    textComponent() {
      return 'nodeText'
    },
  },
  methods: {
    onTextClick() {
      this.$emit('clicktext', this.content)
    },
    onExit(node) {
      // console.log("on exit");
      this.el
        .select('text')
        .transition()
        .duration(this.duration)
        .style('opacity', 0)
    },
  },
}
</script>
