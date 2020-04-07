<template>
  <div class="outerDiv">
    <div
      class="innerDiv"
      v-b-tooltip.hover.top.o100="{ customClass: 'my-tooltip-cls' }"
      :title="this.content.text"
    >
      {{ this.content.text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'cell-slanted',
  props: ['content'],
  watch: {
    content: {
      handler: function (val, oldVal) {},
    },
  },
  mounted() {},
  data() {
    return {}
  },
  methods: {},
}
</script>
<style scoped>
.my-tooltip-cls .tooltip-inner {
  /* font-weight: bold; */
  background-color: aqua !important;
  color: aqua !important;
}
.outerDiv {
  background-color: transparent;
  height: 150px;
  width: 30px;
  transform: skew(-10deg) translate(16%);
}
.innerDiv {
  position: absolute;
  text-align: left;
  transform: skew(-3deg) rotate(-87deg);
  transform-origin: 0 0;
  bottom: -13%;
  left: 4px;
  width: 140px;
  height: 30px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
