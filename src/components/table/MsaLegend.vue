<template>
    <div class="legend">
        <div class="title">MSA LEGEND</div>
        <div class="content title">
            <svg id="legendSvg" width="100%" height="140px">
                <g>
                    <path class="straight" :d="straightLine(450, 2)" fill="black"></path>
                </g>
                <g>
                    <text x="20" y="25" fill="black">upper case</text>
                    <text x="135" y="25" fill="black">Match state, shared by at least 30% sequences</text>
                </g>
                <g>
                    <text x="20" y="45" fill="black">lower case</text>
                    <text x="135" y="45" fill="black">Non-match state</text>
                </g>
                <g>
                    <text x="20" y="65" fill="black">x</text>
                    <text x="135" y="65" fill="black">Undetermined residue</text>
                </g>
                <g>
                    <text x="20" y="85" fill="black">.</text>                    
                    <text x="135" y="85" fill="black">Gap in non-match state</text>
                </g>
                <g>
                    <rect x="20" y="95" width="20" height="15" fill="#bf8f00"> </rect>
                    <text x="135" y="105" fill="black">Shared by 90-100% sequences</text>
                </g>
                <g>
                    <rect x="20" y="115" width="20" height="15" fill="#ffd966"> </rect>
                    <text x="135" y="125" fill="black">Shared by 50-90% sequences</text>
                </g>
            </svg>
        </div>
    </div>
</template>

<script>
    import * as d3 from 'd3';

    export default {
        name: "msaLegend",
        data() {
            return {
                
            }
        },
        computed: {
            
        },
        methods: {
            straightLine(x,y) {
                var lineGenerator = d3.line();
                var points = [
                    [0,y],
                    [x,y]
                ]
                return lineGenerator(points);
            },
        }
    }
</script>

<style scoped>
    .legend {
        border-color: #d47137!important;
        border: 2px solid;
        box-sizing: border-box;
        box-shadow: 0 0 4px 2px rgba(0,0,0,.1);
        background-color: white;
        position: relative;
        /*width: 200px;*/
        /*height: 250px;*/
        z-index: 999;
    }

    .title{
        padding: 5px 5px 0px 5px;
        text-align: center;
        font-weight: bold;
    }

    .content {
        padding: 0px 5px 5px 5px;
        width: 630px;
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
        fill: #0000FF
    }
</style>