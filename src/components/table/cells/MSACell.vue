<template>
    <div class="tdParent">
        <span v-for="(c,i) in filteredTextArr" :key=i
                :class='getHighlightClass(c)'>{{c.letters}}</span>
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
        data() {
            return {
            };
        },
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
                // return this.textArr.filter(c => {return c.highlight;});
                return this.textArr;
            },
            ...mapGetters({ 
                store_getFreqMsa: types.TABLE_GET_MSA_FREQ
            }),
            mutableContent() {
                return this.content;
            }
        },
        mounted() {
            if(this.content && this.content.text) {
                this.tdWidth = 20 + this.store_getFreqMsa.length*8.5;
                this.setTextArray("mounted", this.content.text);
            }
        },
        updated() {
            this.$nextTick(function () {
               
            });
        },
        beforeDestroy() {
            // this.$emit('destroyed', this.content.id);
        }, 
        data() {
            return {
                tdWidth: '1000px',
                tdHeight: '30px',
                textArr: [],
                isLoading: false,
                localFreq: [],
                TIMEOUT_HIGHLIGHT_PROCESSING: 100,
                SVG_LETTER_GAP: 8.501,
            }
        },
        methods: {
            getHighlightClass(l) {
                if(l.highlight==false) 'defaultRect';
                else if(l.highlightType == "dark") return 'darkRect';
                else return 'lightRect';
            },
            setTextArray(pm, text) {
                this.isLoading = true;
                this.mutableContent.process = true;
                this.$emit('update:content', this.mutableContent);

                if(pm == "watch") {
                    // setTimeout(() => {
                    //     this.processHighlight(text).then(textArr => {
                    //         this.textArr = textArr;
                    //     });
                    // }, this.TIMEOUT_HIGHLIGHT_PROCESSING);
                    this.isLoading = false;
                    return;
                }
 
                setTimeout(() => {
                    this.processHighlight(text).then(textArr => {
                       this.textArr = textArr;
                    });
                }, this.TIMEOUT_HIGHLIGHT_PROCESSING);
                this.isLoading = false;
            },
            async processHighlight(text) {
                let textArr = [];
                let splits = text.split('');
                let splitTxt = '';
                // console.log("OT: " + text);
                let c = 0;
                for(var i = 0; i < splits.length; i++) {
                    let l = splits[i];
                    let letterObj = {letters: '', highlight: 0};
                    let hfl = this.store_getFreqMsa[i];
                    
                    if(l== "." || l == "-" || l != hfl.l) {
                        splitTxt += l;
                    } else {
                        if(splitTxt.length > 0) {
                            
                            letterObj.letters = splitTxt;
                            letterObj.highlight = 0;
                            textArr.push(letterObj);

                            textArr.push({letters: l, highlight: 1});

                            c += splitTxt.length + 1;
                        } else {
                            splitTxt = l;
                            letterObj.letters = splitTxt;
                            letterObj.highlight = 1;
                            textArr.push(letterObj);
                            c += splitTxt.length;
                        }
                        splitTxt = '';
                    }
                }
                if(splitTxt.length > 0) {
                    textArr.push({letters: splitTxt, highlight: 0});
                }
                this.mutableContent.process = false;
                this.$emit('update:content', this.mutableContent);
                return textArr;
            }
        }
    }
</script>
<style scoped> 
    .defaultRect {
        background-color:white;
        font-family: monospace;
        letter-spacing: 0.1px;
    }
    .darkRect {
        background-color: #c9641d;
        font-family: monospace;
        letter-spacing: 0.1px;
        /* fill-opacity: 0.7; */
    }
    .lightRect {
        background-color: #eca979;
        font-family: monospace;
        letter-spacing: 0.1px;
        /* fill-opacity: 0.7; */
    }
    .msaTextSvg {
        padding-left: 10px;
        font-family: monospace;
    }
    .msaTextPlain {
        font-size: 14px;
        /* padding-left: 10px; */
        font-family: monospace;
        letter-spacing: 0.1px;
    }
    .tdParent {
        padding-left: 10px;
        width: 100%;
    }
    .tdSpan {
        font-size: 14px;
        font-family: monospace;
        background-color: rgb(255,255,255);
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
</style>