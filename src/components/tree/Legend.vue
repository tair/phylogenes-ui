<template>
    <div class="legend" :style="style">
        <div class="title">LEGEND</div>
        <div class="content">
            <svg id="legendSvg" width="100%" height="200px">
                <g>
                    <circle r="12" cx="35" cy="20" fill="#56c356"></circle>
                    <text x="60" y="23">Speciation Node</text>
                </g>
                <g>
                    <circle r="12" cx="35" cy="60" fill="#f4a460"></circle>
                    <text x="60" y="63">Duplication Node</text>
                </g>
                <g>
                    <circle r="12" cx="35" cy="100" fill="steelblue"></circle>
                    <text x="60" y="103">Horizontal Transfer</text>
                </g>
                <g>
                    <path class="diamond" :d="diamondSymbol()" transform="translate(35,142)" fill="red"></path>
                    <text x="60" y="142">Subfamily Node</text>
                </g>
                <g>
                    <path class="triangle" :d="triangleSymbol()" transform="translate(35,182)" fill="grey"></path>
                    <text x="60" y="182">Collapsed Node</text>
                </g>
            </svg>
        </div>
    </div>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        name: "treeLegend",
        data() {
            return {
                x: 900,
                y: 200
            }
        },
        computed: {
            style() {
                return {
                    top: this.y - document.body.scrollTop + 'px',
                    left: this.x + 'px'
                };
            }
        },
        methods: {
            diamondSymbol() {
                var symbolGenerator = d3.symbol()
                    .size([400]);

                symbolGenerator
                    .type(d3.symbolDiamond);

                return symbolGenerator();
            },
            triangleSymbol() {
                var symbolGenerator = d3.symbol()
                    .size([300]);

                symbolGenerator
                    .type(d3.symbolTriangle);

                return symbolGenerator();
            }
        }
    }
</script>

<style scoped>
    .legend {
        border-color: #f4a460!important;
        border: 1px solid;
        box-sizing: border-box;
        box-shadow: 0 0 4px 2px rgba(0,0,0,.1);

        position: fixed;
        width: 200px;
        height: 250px;
        z-index: 999;
    }

    .title{
        padding: 5px;
       text-align: center;
        font-weight: bold;
    }

    .content {
        padding: 5px;
    }

    circle {
        stroke: steelblue;
        stroke-width: 2px;
    }

    .diamond {
        stroke: white;
        stroke-width: 2px;
        fill: #1b2ad8
    }
</style>