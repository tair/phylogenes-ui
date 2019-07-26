<template>
    <span>
        <span v-if="cellText != '*' && type != 'Uniprot ID' && type != 'Publications'" 
                class="spanText"
                data-toggle="tooltip" :title="computedText">
                {{computedText}}
        </span>
        <a v-else-if="cellText != '*' && type == 'Uniprot ID'" 
                class="spanText"
                data-toggle="tooltip" :title="computedText"
                :href="'https://www.uniprot.org/uniprot/'+computedText" target="_blank">
                {{computedText}}
        </a>
        <a v-else-if="cellText != '*' && type == 'Publications'" 
                class="spanText"
                data-toggle="tooltip" :title="computedText" href="#">
                {{computedText}}
        </a>
        <span v-else>
            <svg :width=tdWidth :height=tdHeight>
                <g>
                    <text v-if="cellText != '*'"
                            dy=".35em" x=5 y=17 
                            :class="getTextClass()">{{computedText}}</text>
                    <circle v-else class="anno_circle"
                            cx="100" cy="18"></circle>
                </g>
            </svg>
        </span>
   </span>
</template>

<script>
    import * as d3 from 'd3';
    import _ from 'lodash';
    import { setTimeout } from 'timers';
    export default {
        name: "tablecell",
        props: ['cellText', 'type'],
        components: {
           
        },
        data() {
            return {
                tdWidth: '190px',
                tdHeight: '30px',
                el: null,
                origText: "",
                computedText: "",
                cellWidth: 180,
                isEllipsis: false
            }
        },
        computed: {
            
        },
        watch: {
            cellText: {
                handler: function (val, oldVal) {
                    this.setComputedText();
                }
            }
        },
        mounted: function () {
            this.el = d3.select(this.$el);
            this.setComputedText();
        },
        methods: {
            setComputedText() {
                let textNode = this.el.select('text').node();
                this.origText = this.cellText ? this.cellText:"";
                this.computedText = this.cellText ? this.cellText:"";
                if(textNode) {
                    setTimeout(() => {
                        //Get text pixels width instead of just the normal text length since
                        // pixel size is more depending on the type of text.
                        let computedLength = textNode.getComputedTextLength();
                        //If computed text length is greater than cell width, than slice the text 
                        // and show ellipsis. When you hover over the ellipsis text it will show
                        // tooltip with full text. (Todo)
                        if(computedLength > this.cellWidth) {
                            let splitText = this.cellText.slice(0, 17);
                            if(this.type === 'th') {
                                splitText = this.cellText.slice(0, 22); 
                            } 
                            this.computedText = splitText + "..."; 
                            this.isEllipsis = true;
                            this.processOnMouseHover();
                        }
                    }, 100);
                }
            },
            processOnMouseHover() {
                this.el.on("mouseenter", () => {
                    let lineNumber = this.wrapText(this.cellText, this.cellWidth);
                    if(lineNumber == 3) {
                        this.tdHeight = '60px';
                    } else if(lineNumber == 2) {
                        this.tdHeight = '50px';
                    } else {
                        this.tdHeight = '40px';
                    }
                })
                .on("mouseleave", () => {
                    this.tdHeight = '30px';
                    this.el.select('text').attr('y', 17).text(this.computedText);
                });
            },
            //Modified from: https://bl.ocks.org/mbostock/5247027
            wrapText(celltext, width) {
                var text = this.el.select('text'),
                    words = celltext.match(/.{1,5}/g).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y")-8,
                    x = 5,
                    dy = parseFloat(text.attr("dy")),
                    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
          
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(""));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(""));
                        line = [word];
                        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
                return lineNumber;
            },
            getTextClass() {
                if(this.type === 'th') {
                    return 'thClass'
                }
                return "";
            }
        },
        destroyed: function () {
            
        }
    }
</script>
<style>
    .thClass {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .anno_circle {
        r: 8;
        fill: #ff0;
        stroke: steelblue;
        stroke-width: 2px;
    }
    .spanText {
        padding-left: 10px;
    }
</style>

