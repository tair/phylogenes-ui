<template>
    <div><!-- <div style="overflow:scroll;"> -->
        <svg :width=tdWidth :height=tdHeight>
            <g v-for="(c,i) in textArr" :key=i>
                <rect v-if='c.highlight' :class='getRectClass(c)' :x=10+i*8.5 y=8 width=10 height=80></rect>
                <text dx=".35em" dy=".35em" :x=5+i*8.5 y=17 
                        class="msaText">{{c.letter}}</text>
            </g>
        </svg>
    </div>
    
</template>

<script>
    import * as d3 from 'd3';
    export default {
        name: "cell-msa",
        props: ["content"],
        watch: {
            content: {
                handler: function (val, oldVal) {
                }
            }
        },
        mounted() {
            if(this.content && this.content.text) {
                this.textArr = this.content.splitByLetter;
                this.tdWidth = 20 + this.textArr.length*8.5;
            }
        },
        data() {
            return {
                tdWidth: '1000px',
                tdHeight: '30px',
                textArr: [],
            }
        },
        methods: {
            getRectClass(letter) {
                if(letter.highlightType == "dark") return 'darkRect';
                else return 'lightRect';
                
            }
        }
    }
</script>
<style scoped> 
    .darkRect {
        fill: #c9641d;
        fill-opacity: 0.7;
    }
    .lightRect {
        fill: #eca979;
        fill-opacity: 0.7;
    }
    .msaText {
        padding-left: 10px;
        font-family: monospace;
    }

    /* ::-webkit-scrollbar {
        width: 3px;
        height: 5px;
    }

    ::-webkit-scrollbar:vertical {
        display: none;
    }
 
    ::-webkit-scrollbar-track {
        -webkit-box-shadow: inset 0 0 20px rgba(0,0,0,0.3); 
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
        border-radius: 10px;
        -webkit-box-shadow: inset 0 0 50px rgba(45,125,200,1); 
    }

    ::-webkit-scrollbar-thumb:hover {
        -webkit-box-shadow: inset 0 0 50px rgba(45,125,200,1);
    } */
</style>