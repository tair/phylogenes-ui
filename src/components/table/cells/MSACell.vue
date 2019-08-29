<template>
    <div class="parent"><!-- <div style="overflow:scroll;"> -->
        <div class="overlay">
            <div class="element">
                <span class="msaTextPlain">{{this.content.text}}</span>
            </div>
        </div>
        <!-- <span class="msaText">{{this.content.text}}</span> -->
        <svg :width=tdWidth :height=tdHeight>
            <g v-for="(c,i) in filteredTextArr" :key=i>
                <rect v-if='c.highlight' :class='getRectClass(c)' :x=10+c.index*svgLetterGap y=8 width=10 height=80></rect>
                <text dx=".35em" dy=".35em" :x=5+c.index*svgLetterGap y=17 
                        class="msaTextSvg">{{c.letter}}</text>
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
        computed: {
            filteredTextArr() {
                // return this.textArr;
                return this.textArr.filter(c => {return c.highlight;});
            }
        },
        mounted() {
            if(this.content && this.content.text) {
                this.textArr = this.content.splitByLetter;
                let i = 0;
                if(this.textArr) {
                    this.tdWidth = 20 + this.textArr.length*8.5;
                    // console.log("Mounted ", this.textArr.length);
                }
            }
        },
        updated() {
            this.$nextTick(function () {
                // console.log("Updated");
            });
        },
        data() {
            return {
                tdWidth: '1000px',
                tdHeight: '30px',
                textArr: [],
                svgLetterGap: 8.501
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
    .msaTextSvg {
        padding-left: 10px;
        font-family: monospace;
    }
    .msaTextPlain {
        padding-left: 10px;
        font-family: monospace;
        letter-spacing: 0.1px;
    }
    .parent {
        position: relative;
    }
    .overlay {
        position: absolute;
        background: rgba(100,100,100,0);
        width:1000px;
        height:40px;
        top:0px;
        bottom:0px;
        left:0px;
        right:0px;
    }
    .element {
        position: absolute;
        width:100px;
        height:40px;
        top: 6px;
        left: 0px;
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