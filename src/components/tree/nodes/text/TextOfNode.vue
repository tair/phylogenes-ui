<template>
  <g>
    <text
      id="nodeText"
      dy=".35em"
      :x="textPosn.x"
      :y="textPosn.y"
      :fill="color"
      @click.stop.prevent="onClick"
    >{{ getText() }}</text>
  </g>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'node-text',
  props: ['content'],
  watch: {
    content: {
      handler: function (val, oldVal) {
        // console.log(val);
        this.renderText()
      },
    },
  },
  data() {
    return {
      el: null,
      textPosn: {
        x: 15,
        y: 0,
      },
      color: 'black',
    }
  },
  mounted() {
    // console.log(this.content.text);
    if (this.content != null) {
      this.el = d3.select(this.$el)
      this.renderText()
    }
  },
  computed: {},
  methods: {
    onClick() {
      this.$emit('clicked', this.content);
    },
    renderText() {
      //Appearance
      this.setFill()
    },
    getText() {
      if (this.content.updatedText) {
        return this.content.updatedText
      }
      return this.content.text
    },
    setFill() {
      this.color = this.content.textColor
    },
  },
}
</script>
<style scoped>
#nodeText {
  font-size: 14px;
  font-family: sans-serif;
  font-weight: bold;
  cursor: pointer;
}
#nodeText:hover {
  font-size: 15px;
}
</style>
