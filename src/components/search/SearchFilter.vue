<template>
    <div class="bg-lblue">

        <div>
            <label for="famName" class="text-dark text-md-left my-1">Search gene family</label>
            <div class="form-group mb-2">

                <div class="form-inline my-lg-0">
                    <input class="form-control input-lg w-100 px-2" id="famName"
                           v-on:keyup.enter="doSearch()" v-model="searchText"
                           aria-describedby="Family Name" 
                           placeholder="Search by Uniprot ID, gene ID, gene symbol, or keyword">
                </div>
                <div class="form-inline my-lg-0 justify-content-end pt-2">
                    <a href="#" class="btn btn-pggrey mr-2" @click.prevent="doSearch()">
                        <i class="fas fa-search"></i>
                    </a>
                    <a href="#" class="btn btn-pggrey" @click.prevent="doReset()">
                        <i class="fas fa-times"></i>
                    </a>
                </div>
            </div>

        </div>

        <div>
            <label for="famName" class="text-dark text-md-left my-1">Filter by</label>
            <div class="text-bold text-dark py-2 pt-0" style="border-bottom: 1px solid #dfdfdf">Taxonomic Range</div>
            <div class="list-group" style="max-height: 200px; overflow: auto;">
                <div v-for="data in orderedSpecies" :key="data.key" class="list-group-item list-group-item-action borderless text-muted">
                    <input type="checkbox" :value="data.key" v-on:change="onFiltersChange()" v-model="treeFilters.species">
                    <span class="pl-2 text-dark">{{ data.key | fullName }}</span>
                    <span class="float-right badge badge-pill badge-danger">{{ data.count }}</span>
                </div>
            </div>

            <div class="text-bold text-dark py-2 pt-5" style="border-bottom: 1px solid #dfdfdf">Organisms included</div>
            <div class="list-group" style="max-height: 200px; overflow: auto;">
                <div v-for="data in orderedOrganisms" :key="data.key" class="list-group-item list-group-item-action borderless text-muted">
                    <input type="checkbox" :value="data.key" v-on:change="onFiltersChange()" v-model="treeFilters.organisms">
                    <span class="pl-2 text-dark">{{ data.key }}</span>
                    <span class="float-right badge badge-pill badge-danger">{{ data.count }}</span>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
    import * as types from '../../store/types_tree';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    export default {
        name: "SearchFilter",
        data() {
            return {
                treeFilters: null,
                searchText: null
            }
        },
        props: {
            facets: {
                type: Object,
                required: true
            }
        },
        created() {
            this.treeFilters = this.stateSearchFilters;
            this.searchText = this.stateSearchText;
        },
        computed: {
            ...mapGetters({
                stateSearchFilters: types.TREE_GET_FILTERS,
                stateSearchText: types.TREE_GET_SEARCH_TEXT
            }),
            orderedSpecies: function () {
                return _.orderBy(this.facets.species, 'key')
            },
            orderedOrganisms: function () {
                return _.orderBy(this.facets.organisms, 'key')
            }
        },
        methods: {
            ...mapActions({
                stateAction_setSearchFilters: types.TREE_ACTION_SET_FILTER,
                stateAction_doSearch: types.TREE_ACTION_DO_SEARCH
            }),
            onFiltersChange() {
              this.stateAction_setSearchFilters(this.treeFilters);
              this.doSearch();
            },
            doSearch() {
                var payload = {
                    searchText: this.searchText,
                    filters: this.stateSearchFilters
                };
                this.stateAction_doSearch(payload);
            },
            doReset() {
                this.searchText = null;
            },
            resetFilters() {
                this.treeFilters.organisms = [];
                this.treeFilters.species = [];
                this.stateAction_setSearchFilters(this.treeFilters);
                this.searchText = this.stateSearchText;
            }
        },
        watch: {
            stateSearchFilters:{
                deep: true,
                handler (val, oldVal){
                    this.treeFilters = this.stateSearchFilters;
                }
            }
        },
        filters:{
        fullName(value){
            if (value == 'LUCA'){
                return 'Last Universal Common Ancestor';
            }
            return value;
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
