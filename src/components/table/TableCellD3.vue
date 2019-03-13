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
                isEllipsis: false
            }
        },
        computed: {
            
        },
        watch: {
            
        },
        mounted: function () {
            this.el = d3.select(this.$el);
            this.el.select('g')
                .append("div")
                .attr("class", "mytooltip")				
                .style("opacity", .9);

            this.setComputedText();
        },
        methods: {
            setComputedText() {
                let textNode = this.el.select('text').node();

                if(textNode) {
                    this.origText = this.cellText;
                    this.computedText = this.cellText;
                    setTimeout(() => {
                        let computedLength = textNode.getComputedTextLength();
                        if(computedLength > 180) {
                            this.computedText = this.cellText.slice(0, 17);
                            this.computedText += "..."; 
                            this.isEllipsis = true;
                            this.el.select('text')
                                .on("mouseover", function(d) {		
                                    div.transition()		
                                        .duration(200)		
                                        .style("opacity", .9);		
                                    div	.html(formatTime(d.date) + "<br/>"  + d.close)	
                                        .style("left", (d3.event.pageX) + "px")		
                                        .style("top", (d3.event.pageY - 28) + "px");	
                                    })					
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
    .mytooltip {	
        position: absolute;			
        text-align: center;
        left: 30px;
        top: 50px;			
        width: 60px;					
        height: 28px;					
        padding: 2px;				
        font: 12px sans-serif;		
        background: lightsteelblue;	
        border: 0px;		
        border-radius: 8px;			
        pointer-events: none;			
    }
</style>

