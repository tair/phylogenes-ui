<template>
  <div class="parent">
    <table class="popupTable">
      <thead id="head">
        <tr>
          <th v-for="col in cols">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data">
          <td v-for="cell in row">
            <span v-if="!cell.type">{{ cell }}</span>
            <a v-if="cell.type == 'link'" v-bind:href="cell.link" target="_blank">{{ cell.text }}</a>
            <a
              v-if="cell.type == 'links'"
              v-for="(ref, i) in cell.links"
              v-bind:href="ref.link"
              target="_blank"
            >
              {{ ref.text }}
              <span v-if="i != cell.links.length - 1">,</span>
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
export default {
  name: 'popupTable',
  props: ['cols', 'data'],
  watch: {
    cols: {
      handler: function (val, oldVal) {
        this.cols = val
      },
    },
  },
  mounted() {},
  data() {
    return {}
  },
}
</script>
<style scoped>
.parent {
  width: auto;
}
.popupTable {
  margin: auto;
}

.popupTable th {
  width: 100px;
  align-self: center;
  min-width: 100px;
  max-width: 100px;
  height: 40px;
  max-height: 100px;
  word-wrap: break-word;
  white-space: normal;
  background-color: #c5dcf0;
  box-shadow: 2px 0 2px -2px #f1f1f0;
}

.popupTable td {
  width: 100px;
  min-width: 100px;
  max-width: 100px;
  word-wrap: break-word;
  white-space: normal;
  box-shadow: 2px 0 2px -2px #f1f1f0;
  /* padding-left: 5px; */
  padding-top: 5px;
}
</style>
