<template>
    <div>
        <i v-if="this.isLoading" 
                    class="fa fa-spinner fa-spin fa-2x p-5 text-primary"></i>
        <textarea name="" id="" cols="30" rows="10">

        </textarea>
        <button @click="graft()">Graft</button>
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