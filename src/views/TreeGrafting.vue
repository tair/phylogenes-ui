<template>
    <div>
        <div class="container">
            <div class="row">
                <div class="col">
                    <br>
                    <div class="h4 text-primary mt-4">If the species you are studying is not represented in the Phylogenes 
                        pre-computed gene families, you can submit a protein sequence here. The TreeGrafter tool will search for a matching tree and insert your gene to the tree. The process may take a few minutes.
                    </div>
                    <br> <br>
                    <div class="h5 mt-4"> Enter a protein sequence (raw sequence only)</div>
                    <br>
                    <div>
                        <textarea name="" id="" cols="90" rows="10" v-model="sequence_txt"></textarea>
                        <button class="btn btn-default btn-pggrey float-right mt-2" @click="reset()">Reset</button>
                        <button class="btn btn-default btn-pggrey float-right mt-2" @click="graft()">Graft</button>
                        <i v-if="this.isLoading" class="fa fa-spinner fa-spin fa-2x p-3 float-right text-primary"></i>
                        <div class="text-danger p-3 h5 float-right">
                            {{graftError}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios/index";
import {mapActions} from 'vuex';
import * as types from '../store/types_treedata';

export default {
    name: "TreeGrafting",
    data() {
        return {
            GRAFTING_PANTHER_API: process.env.VUE_APP_TOMCAT_URL + '/panther/grafting',
            isLoading: false,
            sequence_txt: "",
            graftError: ""
        }
    },
    mounted() {
        this.reset();
    },
    beforeRouteLeave (to, from, next) {
        // called when the route that renders this component is about to
        // be navigated away from.
        // has access to `this` component instance.
        this.reset();
        next();
    },
    methods: {
        ...mapActions({
            store_setPantherTreeFromString: types.TREE_ACTION_SET_PANTHER_TREE2,
            store_setGraftSeq: types.TREE_ACTION_SET_GRAFTSEQ
        }),
        reset() {
            if(!this.isLoading) {
                this.graftError = "";
                this.sequence_txt = "";
            }
        },
        graft() {
            this.graftError = "";
            let api =  this.GRAFTING_PANTHER_API;
            this.isLoading = true;
            let processedSeq = this.processTxt();
            axios({
                method: 'POST',
                url: api,
                data: {
                    sequence: processedSeq
                },
                timeout: 200000
            })
            .then(res => {
                let graftedTreeJson = res.data;
                if(graftedTreeJson.search.error) {
                    this.graftError = graftedTreeJson.search.error;
                    this.isLoading = false;
                } else if(!graftedTreeJson.search.book) {
                    console.log(graftedTreeJson);
                    this.graftError = "Connection Timed Out";
                    this.isLoading = false;
                } else{
                    this.store_setGraftSeq(processedSeq);
                    this.loadGraftedJson(graftedTreeJson);
                }
                this.isLoading = false;
            })
            .catch(err => {
                console.error("error ", err);
                this.graftError = err.message;
                this.isLoading = false;
            });
        },
        processTxt() {
            var cleanString = this.sequence_txt.replace(/[|&;$%@"<>()+,]/g, "");
            cleanString = this.sequence_txt.replace(/\r?\n|\r/g, "");
            cleanString = this.sequence_txt.replace(/\s/g,'');
            return cleanString;
        },
        loadGraftedJson(treeJson) {
            this.store_setPantherTreeFromString(treeJson);
            this.$router.push({name: 'treeGrafted'});
        },
    }

}
</script>
<style scoped>
    @media only screen and (min-width : 1200px) {
        .container { width: 700px; } 
    }
</style>