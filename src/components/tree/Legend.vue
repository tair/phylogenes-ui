<template>
  <div class="legend">
    <div class="title">LEGEND</div>
    <div class="content">
      <svg id="legendSvg" width="100%" height="248px">
        <g>
          <circle r="7" cx="20" cy="20" fill="#00FF00"></circle>
          <text x="45" y="25" fill="black">Speciation Node</text>
        </g>
        <g>
          <circle r="7" cx="20" cy="60" fill="#FFA500"></circle>
          <text x="45" y="65" fill="black">Duplication Node</text>
        </g>
        <g>
          <circle r="7" cx="20" cy="100" fill="#00FFFF"></circle>
          <text x="45" y="105" fill="black">Horizontal Transfer</text>
        </g>
        <g>
          <path
            class="diamond"
            :d="diamondSymbol()"
            transform="translate(20,142)"
            fill="red"
          ></path>
          <text x="45" y="145" fill="black">Subfamily Node</text>
        </g>
        <g>
          <path
            class="triangle"
            :d="triangleSymbol()"
            transform="translate(20,182) rotate(-90)"
            fill="grey"
          ></path>
          <text x="45" y="185" fill="black">Collapsed Node</text>
        </g>
        <g>
          <path class="straight" :d="straightLine(215, 2)" fill="black"></path>
          <path
            class="straight"
            :d="straightLine(215, 202)"
            fill="black"
          ></path>
          <text x="8" y="223" fill="black" font-weight="bold">
            Click node to collapse or expand.
          </text>
          <text x="8" y="243" fill="black" font-weight="bold">
            Drag tree to move around.
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3'

export default {
  name: 'treeLegend',
  data() {
    return {
      x: 900,
      y: 200,
    }
  },
  computed: {
    style() {
      return {
        top: this.y - document.body.scrollTop + 'px',
        left: this.x + 'px',
      }
    },
  },
  methods: {
    diamondSymbol() {
      var symbolGenerator = d3.symbol().size([200])

      symbolGenerator.type(d3.symbolDiamond)

      return symbolGenerator()
    },
    triangleSymbol() {
      var symbolGenerator = d3.symbol().size([300])

      symbolGenerator.type(d3.symbolTriangle)

      return symbolGenerator()
    },
    straightLine(x, y) {
      var lineGenerator = d3.line()
      var points = [
        [0, y],
        [x, y],
      ]
      return lineGenerator(points)
    },
    rotate() {
      return 'rotate(-90)'
    },
  },
}
</script>

<style scoped>
.legend {
  border-color: #d47137 !important;
  border: 2px solid;
  box-sizing: border-box;
  box-shadow: 0 0 4px 2px rgba(0, 0, 0, 0.1);
  background-color: white;
  position: relative;
  /*width: 200px;*/
  /*height: 250px;*/
  z-index: 999;
}

.title {
  padding: 5px 5px 0px 5px;
  text-align: center;
  font-weight: bold;
}

.content {
  padding: 0px 5px 5px 5px;
  width: 230px;
}

circle {
  stroke: steelblue;
  stroke-width: 0px;
}

.straight {
  stroke: #d47137;
  stroke-width: 2px;
}

.diamond {
  stroke: white;
  stroke-width: 0px;
  fill: #0000ff;
}
</style>
