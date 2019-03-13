<template>
   <svg :width=tdWidth :height=tdHeight>
       <g>
           <text v-if="cellText != '*'"
                 dy=".35em" x=5 y=20>{{computedText}}</text>
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
                        if(computedLength > cellWidth) {
                            this.computedText = this.cellText.slice(0, 17);
                            this.computedText += "..."; 
                            this.isEllipsis = true;				
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

