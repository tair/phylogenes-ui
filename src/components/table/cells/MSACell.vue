<template>
    <div class="parent">
        <div class="overlay">
            <div class="element">
                <span class="msaTextPlain">{{this.content.text}}</span>
            </div>
        </div>
        
        <svg :width=tdWidth :height=tdHeight>
            <g v-for="(c,i) in filteredTextArr" :key=i>
                <rect v-if='c.highlight' :class='getRectClass(c)' :x=10+c.index*svgLetterGap y=8 width=10 height=80></rect>
                <!-- <text dx=".35em" dy=".35em" :x=5+c.index*svgLetterGap y=17 
                        class="msaTextSvg">{{c.letter}}</text> -->
            </g>
        </svg>
    </div>
    
</template>

<script>
    import * as d3 from 'd3';
    import * as types from '../../../store/types_treedata';
    import { mapGetters, mapActions } from 'vuex';
import { setTimeout } from 'timers';

    export default {
        name: "cell-msa",
        props: ["content"],
        watch: {
            content: {
                handler: function (val, oldVal) {
                    if(val && val.text) {
                        if(!this.isLoading) {
                            this.setTextArray("watch", val.text);
                        }
                    }
                }
            }
        },
        computed: {
            filteredTextArr() {
                // return this.textArr;
                return this.textArr.filter(c => {return c.highlight;});
            },
            ...mapGetters({ 
                store_getFreqMsa: types.TABLE_GET_MSA_FREQ
            })
        },
        mounted() {
            if(this.content && this.content.text) {
                this.tdWidth = 20 + this.store_getFreqMsa.length*8.5;
                this.setTextArray("mounted", this.content.text);
            }
        },
        updated() {
            this.$nextTick(function () {
                // console.log("Updated ", this.randInd);
            });
        },
        destroyed() {
            // console.log("destroyed", this.randInd);
        },
        data() {
            return {
                tdWidth: '1000px',
                tdHeight: '30px',
                textArr: [],
                svgLetterGap: 8.501,
                isLoading: false,
                localFreq: []
            }
        },
        methods: {
            getRectClass(letter) {
                if(letter.highlightType == "dark") return 'darkRect';
                else return 'lightRect';
            },
            setTextArray(pm, text) {
                this.isLoading = true;
                if(pm == "watch") {
                    this.isLoading = false;
                    return;
                }

                setTimeout(() => {
                    this.processHighlight(text).then(textArr => {
                       this.textArr = textArr;
                    });
                }, 1000);
                
                this.isLoading = false;
            },
            async processHighlight(text) {
                let textArr = [];
                let splits = text.split('');
                for(var i = 0; i < splits.length; i++) {
                    let l = splits[i];
                    let letterObj = {letter: l, index: i, highlight: false};
                    if(l== "." || l == "-") {
                        this.textArr.push(letterObj);
                    } else {
                        let hfl = this.store_getFreqMsa[i];
                        if(l != hfl.l) letterObj.highlight = false;
                        else if(hfl.p > 50) {
                            letterObj.highlight = true;
                            if(hfl.p > 90) letterObj.highlightType = 'dark';
                            else letterObj.highlightType = 'light';
                        }
                    }
                    textArr.push(letterObj);
                }
                return textArr;
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
        /* required for making this cell to render behind the sticky cells */
        z-index: 0; 
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