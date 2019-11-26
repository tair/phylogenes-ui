<template>
    <div class="tdParent">
        <span class="tdTxt" v-html="this.processedHtmlTxt"></span>
        <!-- <span class="tdTxt">{{this.content.text}}</span> -->
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
                            // console.log(this.content.id);
                            this.setTextArray("watch", val.text);
                        }
                    }
                }
            }
        },
        computed: {
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
            // console.log("D " + this.content.id);
            // this.$emit('destroyed', this.content.id);
        }, 
        data() {
            return {
                tdWidth: '1000px',
                tdHeight: '30px',
                processedHtmlTxt: "",
                isLoading: false,
                TIMEOUT_HIGHLIGHT_PROCESSING: 100,
                SVG_LETTER_GAP: 8.501,
            }
        },
        methods: {
            getDebugText() {
                return this.processedHtmlTxt;
            },
            setTextArray(pm, text) {
                this.isLoading = true;
                this.mutableContent.process = true;
                this.$emit('update:content', this.mutableContent);

                if(pm == "watch") {
                    setTimeout(() => {
                        this.processHighlight(text);
                    }, this.TIMEOUT_HIGHLIGHT_PROCESSING);
                    this.isLoading = false;
                    return;
                }
 
                setTimeout(() => {
                    this.processHighlight(text);
                }, this.TIMEOUT_HIGHLIGHT_PROCESSING);
                this.isLoading = false;
            },
            async processHighlight(text) {
                let textArr = [];
                let splits = text.split('');
                this.processedHtmlTxt = "";

                for(var i = 0; i < splits.length; i++) {
                    let l = splits[i];
                    let hfl = this.store_getFreqMsa[i];
                    if(!hfl.l) break;
                    if(hfl.l && hfl.l != "." && hfl.l != "-") {
                        if(hfl.p > 50) {
                            if(l == hfl.l) {
                                if(hfl.p > 50 && hfl.p <= 90) {
                                    l = '<mark class="lightMark">' + l + '</mark>';
                                } else if(hfl.p > 90) {
                                    l = '<mark class="darkMark">' + l + '</mark>';
                                } 
                            } else {
                                //If the letter is in the column with a light or dark mark but is not marked,
                                // we still need to add the <mark> tag otherwise the sequence gets misaligned in the UI.
                                // We add a mark with transparent backgtound.
                                l = '<mark class="absentMark">' + l + '</mark>';
                            }
                        }
                    }
                    
                    this.processedHtmlTxt += l;
                }

                this.mutableContent.process = false;
                this.$emit('update:content', this.mutableContent);
                return textArr;
            }
        }
    }
</script>
<style scoped> 
    .tdParent {
        padding-left: 10px;
        width: 100%;
    }
    .tdTxt {
        font-family: "Courier New", Courier, monospace;
        font-weight: 700;
        letter-spacing: 0.1px;
    }
    .tdTxt >>> .lightMark {
        background-color: #ffd966;
        padding: 0px;
        padding-top: 13px;
        padding-bottom: 13px;
    }
    .tdTxt >>> .darkMark {
        background-color: #bf8f00;
        padding: 0px;
        padding-top: 13px;
        padding-bottom: 13px;
    }
    .tdTxt >>> .absentMark {
        background-color: transparent;
        padding: 0px;
        padding-top: 13px;
        padding-bottom: 13px;
    }
    
</style>