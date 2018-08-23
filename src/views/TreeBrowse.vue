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
                <tree-filter
                    :facets="stateTreeData.facets"
                    ></tree-filter>
                </div>
                <div v-if="this.stateTreeIsError" class="text-danger pt-4 h5">
                    Error occurred while reading data.
                </div>
            </div>

            <div class="col-sm-12 col-md-8 col-lg-9 px-4" style="height: 100vh; overflow: auto;">

                <i v-if="this.stateTreeIsLoading" class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
                <tree-result v-if="!this.stateTreeIsError && !this.stateTreeIsLoading" :treeData="stateTreeData"></tree-result>
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
    import TreeFilter from '@/components/tree/TreeFilter'
    import TreeResult from '@/components/tree/TreeResult'

    import * as types from '../store/types_tree';
    import {mapGetters} from 'vuex';
    import {mapActions} from 'vuex';

    export default {
        components: {
            Relax,
            SiteMap,
            TreeFilter,
            TreeResult
        },
        data() {
            return {
                name: "Tree Browse",
                treeFilters: null
            }
        },
        created() {
            this.treeFilters = this.stateTreeFilters;
            this.stateTreeSearchByFilter(this.treeFilters);
        },
        methods: {
            removeFilter(type, val) {
                // console.log(type + ', ' + val);

                var arr = this.treeFilters[type];
                arr.splice(arr.indexOf(val), 1);
                this.onSearch();
            },
            onSearch() {
                this.stateTreeSearchByFilter(this.treeFilters);
            },
            ...mapActions({
                stateTreeSearchByFilter: types.TREE_ACTION_FILTER
            }),
            ...mapActions({
                stateTreeSearchByFilter: types.TREE_ACTION_FILTER
            })
        },
        computed: {
            ...mapGetters({
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
