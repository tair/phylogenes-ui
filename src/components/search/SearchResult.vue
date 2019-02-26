<template>
    <div>
        <div class="row p-2 align-items-center">
                <div class="text-muted text-sm mr-auto">Query time: {{ searchData.queryTime }} ms</div>
                <div class="col-sm-2">
                    <b-input-group size="sm">
                        <b-form-select v-model="perPage" :options="options"/>
                    </b-input-group>
                </div>
                <b-pagination class="mt-3" size="sm" align="center" :total-rows="searchData.numFound" v-model="currentPage" :per-page="perPage">
                </b-pagination>
        </div>
        <div class="alert elevation-0 mb-2 p-1 text-left text-sm" role="alert"
             :class="getAlertClass()">
                {{getRestatedText()}}
        </div>
        <div class="elevation-0 mb-2 p-1">
            <div class="row">
                <div class="col-6">
                    <span class="text-bold">Gene family</span>
                </div>
                <div class="col">
                    <span class="text-bold">Matched field</span>
                </div>
                <div class="col">
                    <span class="text-bold">Number of genes in family</span>
                </div>
            </div>
        </div>
        <div v-for="(data, i) in searchData.results"
             v-bind:class="[i%2==0 ? blueBg : greyBg]"
             class="elevation-0 mb-0 p-2">
            <result-item :item="data"></result-item>
        </div>
    </div>
</template>

<script>
    import ResultItem from '@/components/search/SearchResultItem'

    import * as types from '../../store/types_tree';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    export default {
        props: {
            searchData: {
                type: Object,
                required: true
            }
        },
        watch: {
            searchData: {
                immediate: true,
                handler (val, oldVal) {
                    if(val.numFound == 1) {
                        // console.log();
                        this.$router.push({path: 'tree/' + val.results[0].id})
                    }
                }
            },
            currentPage: {
                handler (val, oldVal){
                    this.treeFilters.startRow = (this.currentPage -1)*this.treeFilters.rows
                    this.setFilter(this.treeFilters);
                }
            },
            perPage: {
                handler (val, oldVal){
                    this.currentPage = 1;
                    this.treeFilters.rows = val;
                    this.setFilter(this.treeFilters);
                }
            },
            stateTreeFilters: {
                deep: true,
                handler (val, oldVal) {
                    this.stateTreePaginate(val);
                }
            }
        },
        data() {
            return {
                treeFilters: null,
                greyBg: 'bg-pggrey',
                blueBg: 'bg-lblue',
                currentPage: 1,
                perPage: 20,
                options: [
                    { value: 10, text: '10 per page' },
                    { value: 20, text: '20 per page' },
                    { value: 50, text: '50 per page' },                   
                    { value: 100, text: '100 per page' },
                ]
            }
        },
        computed: {
            ...mapGetters({
                stateTreeFilters: types.TREE_GET_FILTERS,
                stateSearchText: types.TREE_GET_SEARCH_TEXT
            })
        },
        created() {
            this.treeFilters = this.stateTreeFilters;
            this.perPage = this.treeFilters.rows;
        },
        methods: {
            ...mapActions({
                stateTreePaginate: types.TREE_ACTION_PAGINATE,
                setFilter: types.TREE_ACTION_SET_FILTER
            }),
            newSearch() {
              this.gotoPage(1);
            },
            gotoPage(page) {

                if(page === 0 || page > this.noPages || this.currentPage === page)
                    return;

                this.treeFilters.startRow = (page - 1) * this.treeFilters.rows;
                this.stateTreePaginate(this.treeFilters);
            },
            getRestatedText() {
                var text = "You searched for '" + this.stateSearchText + "'.";
                if(this.stateSearchText == null) {
                    text = "";
                }

                if(this.searchData.numFound == 0) {
                    text += " No Result. Please check spelling.";
                } else {
                    text += " " + this.searchData.numFound + " gene families found.";
                }
                return text;
            },
            getAlertClass() {
                if(this.searchData.numFound == 0) {
                    return "alert-danger";
                }
                return "alert-mblue";
            }
        },
        components: {
            ResultItem
        }
    }

</script>

<style scoped>

</style>

