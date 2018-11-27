<template>
    <div>
        <site-map :current-page="name"></site-map>

        <div class="p-3">
            <span v-for="species in this.treeFilters.species" class="badge badge-pill badge-danger mr-1 p-1">
                {{ species }}
                <a href="#" @click="removeFilter('species', species)" class="text-white"><i class="fas fa-times-circle"></i></a>
            </span>
            <span v-for="organisms in this.treeFilters.organisms" class="badge badge-pill badge-info mr-1 p-1">
                {{ organisms }}
                <a href="#" @click="removeFilter('organisms', organisms)" class="text-white"><i class="fas fa-times-circle"></i></a>
            </span>
            <span v-for="nodeTypes in this.treeFilters.nodeTypes" class="badge badge-pill badge-primary mr-1 p-1">
                {{ nodeTypes }}
                <a href="#" @click="removeFilter('nodeTypes', nodeTypes)" class="text-white"><i class="fas fa-times-circle"></i></a>
            </span>
        </div>

        <div class="row">
            <div class="col-sm-12 col-md-4 col-lg-3 px-4 mb-sm-3" style="height: 100vh; overflow: auto; background: white;">

                <i v-if="this.stateTreeIsLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
                <div v-if="!this.stateTreeIsError && !this.stateTreeIsLoading">
                <search-filter
                    :facets="stateTreeData.facets"
                    ></search-filter>
                </div>
                <div v-if="this.stateTreeIsError" class="text-danger pt-4 h5">
                    Error occurred while reading data.
                </div>
            </div>

            <div class="col-sm-12 col-md-8 col-lg-9 px-4" style="height: 100vh; overflow: auto;">

                <i v-if="this.stateTreeIsLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
                <search-result v-if="showSearchResult()"
                               :searchData="stateTreeData"></search-result>
                <div v-if="this.stateTreeIsError" class="text-danger pt-4 h5">
                    Error occurred while reading data.
                </div>

            </div>
        </div>
    </div>
</template>

<script>
    import Relax from '@/views/Relax'
    import SiteMap from '@/components/SiteMap'
    import SearchFilter from '@/components/search/SearchFilter'
    import SearchResult from '@/components/search/SearchResult';

    import * as types from '../store/types_tree';
    import {mapGetters} from 'vuex';
    import {mapActions} from 'vuex';

    export default {
        components: {
            Relax,
            SiteMap,
            SearchFilter,
            SearchResult
        },
        data() {
            return {
                name: "Tree Browse",
                treeFilters: null
            }
        },
        beforeRouteEnter (to, from, next) {
            console.log("Route enter");
            next(vm => {
                vm.onSearch();
            });
        },
        created() {
            this.treeFilters = this.stateTreeFilters;
            // this.stateTreeSearchByFilter(this.treeFilters);
        },
        methods: {
            showSearchResult() {
              return !this.stateTreeIsError && !this.stateTreeIsLoading;
            },
            removeFilter(type, val) {
                // console.log(type + ', ' + val);

                var arr = this.treeFilters[type];
                arr.splice(arr.indexOf(val), 1);
                this.onSearch();
            },
            onSearch() {
                console.log(this.stateSearchText);
                var payload = {
                    searchText: this.stateSearchText,
                    filters: this.treeFilters
                }

                this.doSearch(payload);
                // this.stateTreeSearchByFilter(this.treeFilters);
            },
            ...mapActions({
                stateTreeSearchByFilter: types.TREE_ACTION_FILTER,
                doSearch: types.TREE_ACTION_DO_SEARCH
            })
        },
        computed: {
            ...mapGetters({
                stateSearchText: types.TREE_GET_SEARCH_TEXT,
                stateTreeData: types.TREE_GET_DATA,
                stateTreeIsError: types.TREE_IS_ERROR,
                stateTreeIsLoading: types.TREE_IS_LOADING,
                stateTreeFilters: types.TREE_GET_FILTERS,
            })
        }
    }
</script>

<style scoped>

</style>
