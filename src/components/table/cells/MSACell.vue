<template>
    <div class="tdParent">
        <span class="tdTxt" v-html="getDebugText()"></span>
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
                    // setTimeout(() => {
                    //     this.processHighlight(text).then(textArr => {
                    //         this.textArr = textArr;
                    //     });
                    // }, this.TIMEOUT_HIGHLIGHT_PROCESSING);
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
                let c = 0;
                for(var i = 0; i < splits.length; i++) {
                    let l = splits[i];
                    let hfl = this.store_getFreqMsa[i];

                    if(l== "." || l == "-" || l != hfl.l) {
                        // if(i % 25 == 0) l = '@'; //debug
                        this.processedHtmlTxt += l;
                    } else {
                        // if(i % 25 == 0) l = '@'; //debug
                        if(hfl.p > 50 && hfl.p <= 90) {
                            l = '<mark class="lightMark">' + l + '</mark>';
                        } else if(hfl.p > 90) {
                            l = '<mark class="darkMark">' + l + '</mark>';
                        }
                        this.processedHtmlTxt += l;
                    }
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
        font-family: monospace;
        letter-spacing: 0.1px;
    }
    .tdTxt >>> .lightMark {
        background-color: #eca979;
        padding: 0px;
    }
    .tdTxt >>> .darkMark {
        background-color: #c9641d;
        padding: 0px;
    }
</style>