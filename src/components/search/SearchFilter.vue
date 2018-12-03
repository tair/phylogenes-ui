<template>
    <div class="filter">
        <!--<div class="h3 text-muted py-3">Search </div>-->

        <div>
            <label for="famName" class="text-dark text-md-left m-1">Search</label>
            <div class="form-group mb-2">

                <div class="form-inline my-lg-0">
                    <input class="form-control input-lg" id="famName"
                           v-on:keyup.enter="doSearch()" v-model="searchText"
                           aria-describedby="Family Name" placeholder="Eg: Protein">
                    <a href="#" class="btn p-2 m-0 pr-5 btn-flat" @click.prevent="doSearch()">
                        <i class="fas fa-search"></i>
                    </a>
                </div>
            </div>

            <!--<input type="text" class="form-control mb-1 form-control-sm" placeholder="Family name" v-on:keyup.enter="onSearch()" v-model="treeFilters.familyName">-->
            <!--<input type="text" class="form-control mb-1 form-control-sm" placeholder="Uniport ID" v-on:keyup.enter="onSearch()" v-model="treeFilters.uniprotId">-->
        </div>

        <div>
            <label for="famName" class="text-dark text-md-left m-1">Filters</label>
            <div class="text-bold text-info py-2 pt-0" style="border-bottom: 1px solid #dfdfdf">Taxonomic Range</div>
            <div class="list-group" style="max-height: 200px; overflow: auto;">
                <div v-for="data in facets.species" class="list-group-item list-group-item-action borderless text-muted">
                    <input type="checkbox" :value="data.key" v-on:change="onFiltersChange()" v-model="treeFilters.species">
                    <span class="pl-2 text-info">{{ data.key }}</span>
                    <span class="float-right badge badge-pill badge-danger">{{ data.count }}</span>
                </div>
            </div>

            <div class="text-bold text-info py-2 pt-5" style="border-bottom: 1px solid #dfdfdf">Organisms</div>
            <div class="list-group" style="max-height: 200px; overflow: auto;">
                <div v-for="data in facets.organisms" class="list-group-item list-group-item-action borderless text-muted">
                    <input type="checkbox" :value="data.key" v-on:change="onFiltersChange()" v-model="treeFilters.organisms">
                    <span class="pl-2 text-info">{{ data.key }}</span>
                    <span class="float-right badge badge-pill badge-danger">{{ data.count }}</span>
                </div>
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
            })
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
            resetFilters() {
                this.treeFilters.organisms = [];
                this.treeFilters.species = [];
                this.stateAction_setSearchFilters(this.treeFilters);
                this.searchText = this.stateSearchText;
            }
        }
    }
</script>

<style scoped>
    .filter {
        background-color: #F1F7EE;
    }
    .list-group-item {
        padding-left: 0px;
        padding-right: 15px;
        padding-bottom: 4px;
        padding-top: 4px;
    }
</style>
