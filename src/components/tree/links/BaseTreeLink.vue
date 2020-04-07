<template>
  <component
    :is="linkComponent"
    ref="myCom"
    :content="content"
    @clicked="onClick"
  >
  </component>
</template>
<script>
import * as d3 from 'd3'
import linkStraight from './StraightLink'

export default {
  name: 'base-link',
  props: ['content'],
  components: {
    linkStraight: linkStraight,
  },
  data() {
    return {
      duration: 750,
      el: null,
    }
  },
  mounted() {
    if (this.content != null) {
      this.el = d3.select(this.$el)
    }
  },
  computed: {
    linkComponent() {
      return 'linkStraight'
    },
  },
  methods: {
    onEnter() {},
    onExit(node) {
      // console.log("on exit");
      this.$refs.myCom.onExit(node)
    },
    onClick() {
      return
    },
  },
}
</script>
