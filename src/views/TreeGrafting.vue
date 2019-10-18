<template>
    <div>
        <!-- <i v-if="this.isLoading" 
                    class="fa fa-spinner fa-spin fa-2x p-5 text-primary"></i>
        <textarea name="" id="" cols="30" rows="10">

        </textarea>
        <button @click="graft()">Graft</button> -->
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
                        <textarea name="" id="" cols="90" rows="10"></textarea>
                            <button class="btn btn-default btn-pggrey float-right mt-2" @click="reset()">Reset</button>
                            <button class="btn btn-default btn-pggrey float-right mt-2" @click="graft()">Graft</button>
                
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
            isLoading: false
        }
    },
    methods: {
        ...mapActions({
            store_setPantherTreeFromString: types.TREE_ACTION_SET_PANTHER_TREE2,
        }),
        reset() {

        },
        graft() {
            let api =  'http://54.68.67.235:8080' + '/panther/grafting';
            this.isLoading = true;
            axios({
                method: 'POST',
                url: api,
                data: {
                    sequence: "MAPTRVQYVAESRPQTIPLEFVRPVEERPINTTFNDDIGLGRQIPVIDMCSLEAPELREKTFKEIARASKEWGIFQVINHAISPSLFESLETVGKQFFQLPQEEKEAYACTGEDGSFTGYGTKLACTTDGRQGWSDFFFHMLWPPSLRDFSKWPQKPSSYIEVTEEYSNRILGVLNKLLSALSISLELQESALKDALGGENLEMELKINYYPTCPQPEVAFGVVPHTDMSALTILKPNDVPGLQVWKDDKWITAHYVPNALIIHIGDQIQILSNGKFKSVLHRSLVNKEKVRMSWPVFCSPPLDTVIGPLKELIDDSNPPLYNAKTYREYKHRKINKLGQ"
                    // sequence: "test"
                }
            })
            .then(res => {
                let graftedTreeJson = res.data;
                this.loadGraftedJson(graftedTreeJson);
                this.isLoading = false;
            })
            .catch(err => {
                console.error("error ", err);
            });
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