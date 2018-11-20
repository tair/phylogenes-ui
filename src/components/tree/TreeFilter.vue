<template>
    <div>
        <div class="h3 text-muted py-3">Search </div>

        <form>
            <div class="form-group mb-2">
                <label for="famName" class="text-dark text-sm m-0">Family Name</label>
                <input class="form-control" id="famName"
                       v-on:keyup.enter="onSearch()" v-model="treeFilters.familyName"
                       aria-describedby="Family Name" placeholder="Eg: Protein">
            </div>
            <div class="form-group mb-2">
                <label for="uniprotId" class="text-dark text-sm m-0">Uniprot ID</label>
                <input class="form-control" id="uniprotId"
                       v-on:keyup.enter="onSearch()" v-model="treeFilters.uniprotId"
                       aria-describedby="Uniprot ID" placeholder="Eg: A0A0R0EIR6">
            </div>

            <!--<input type="text" class="form-control mb-1 form-control-sm" placeholder="Family name" v-on:keyup.enter="onSearch()" v-model="treeFilters.familyName">-->
            <!--<input type="text" class="form-control mb-1 form-control-sm" placeholder="Uniport ID" v-on:keyup.enter="onSearch()" v-model="treeFilters.uniprotId">-->
            <a href="#" class="float-right text-success" @click.prevent="onSearch()">
                <i class="fas fa-search"></i> Search
            </a>
        </form>

        <div class="text-bold text-danger py-2 pt-5" style="border-bottom: 1px solid #dfdfdf">Taxonomic Range</div>
        <div class="list-group" style="max-height: 200px; overflow: auto;">
            <div v-for="data in facets.species" class="list-group-item list-group-item-action borderless text-muted">
                <input type="checkbox" :value="data.key" v-on:change="onSearch()" v-model="treeFilters.species">
                <span class="pl-2 text-danger">{{ data.key }}</span>
                <span class="float-right badge badge-pill badge-danger">{{ data.count }}</span>
            </div>
        </div>

        <div class="text-bold text-info py-2 pt-5" style="border-bottom: 1px solid #dfdfdf">Organisms</div>
        <div class="list-group" style="max-height: 200px; overflow: auto;">
            <div v-for="data in facets.organisms" class="list-group-item list-group-item-action borderless text-muted">
                <input type="checkbox" :value="data.key" v-on:change="onSearch()" v-model="treeFilters.organisms">
                <span class="pl-2 text-info">{{ data.key }}</span>
                <span class="float-right badge badge-pill badge-info">{{ data.count }}</span>
            </div>
        </div>

        <!--<div class="text-bold text-primary py-2 pt-5" style="border-bottom: 1px solid #dfdfdf">Node Types</div>-->
        <!--<div class="list-group" style="max-height: 200px; overflow: auto;">-->
            <!--<div v-for="data in facets.nodeTypes" class="list-group-item list-group-item-action borderless text-muted">-->
                <!--<input type="checkbox" :value="data.key" v-on:change="onSearch()" v-model="treeFilters.nodeTypes">-->
                <!--<span class="pl-2 text-primary">{{ data.key }}</span>-->
                <!--<span class="float-right badge badge-pill badge-primary">{{ data.count }}</span>-->
            <!--</div>-->
        <!--</div>-->
    </div>
</template>

<script>
    import * as types from '../../store/types_tree';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    export default {
        name: "TreeFilter",
        data() {
            return {
                treeFilters: null
            }
        },
        props: {
            facets: {
                type: Object,
                required: true
            }
        },
        created() {
            this.treeFilters = this.stateTreeFilters;
        },
        mounted() {
        },
        computed: {
            ...mapGetters({
                stateTreeFilters: types.TREE_GET_FILTERS,
            })
        },
        methods: {
            ...mapActions({
                stateTreeSearchByFilter: types.TREE_ACTION_FILTER
            }),
            onSearch() {
                this.stateTreeSearchByFilter(this.treeFilters);
            }
        }
    }
</script>

<style scoped>
    .list-group-item {
        padding-left: 0px;
        padding-right: 15px;
        padding-bottom: 4px;
        padding-top: 4px;
    }
</style>
