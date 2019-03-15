<template>
   <svg :width=tdWidth :height=tdHeight>
       <g>
           <text v-if="cellText != '*'"
                 dy=".35em" x=5 y=20 style='word-wrap: break-word'>{{computedText}}</text>
           <circle v-if="cellText == '*'" class="anno_circle"
                 cx="100" cy="18"></circle>
       </g>
   </svg>
</template>

<script>
    import * as d3 from 'd3';
    import _ from 'lodash';
    import { setTimeout } from 'timers';
    export default {
        name: "tablecell",
        props: ['cellText'],
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
            
        },
        mounted: function () {
            this.el = d3.select(this.$el);
            this.setComputedText();
        },
        methods: {
            setComputedText() {
                let textNode = this.el.select('text').node();

                if(textNode) {
                    this.origText = this.cellText;
                    this.computedText = this.cellText;
                    setTimeout(() => {
                        //Get text pixels width instead of just the normal text length since
                        // pixel size is more depending on the type of text.
                        let computedLength = textNode.getComputedTextLength();
                        //If computed text length is greater than cell width, than slice the text 
                        // and show ellipsis. When you hover over the ellipsis text it will show
                        // tooltip with full text. (Todo)
                        if(computedLength > this.cellWidth) {
                            let splitText = this.cellText.slice(0, 17);
                            this.computedText = splitText + "..."; 
                            this.isEllipsis = true;
                            let remainingText = this.cellText.slice(17, this.cellText.length);
                            this.el.on("mouseover", () => {
                                this.tdHeight = '40px';
                                this.el.select('text').attr('y', 15).text(splitText);
                                this.el.select('text').append('tspan')
                                    .attr('x', 5).attr('y', 35).text(remainingText);
                            })
                            .on("mouseout", () => {
                                this.tdHeight = '30px';
                                this.el.select('text').attr('y', 20).text(this.computedText);
                            });

                        }
                    }, 100);
                }
            },
        },
        destroyed: function () {
            
        }
    }
</script>
<style>
    .anno_circle {
        r: 8;
        fill: #ff0;
        stroke: steelblue;
        stroke-width: 2px;
    }
</style>

