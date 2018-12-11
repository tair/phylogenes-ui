<template>
    <div>
        <div class="row p-2 align-items-center">
                <div class="text-muted text-sm mr-auto">Query time: {{ searchData.queryTime }} ms</div>
                <div class="text-primary text-sm">Results found: {{ searchData.numFound }}</div>
                <div class="col-sm-2">
                    <b-input-group size="sm">
                        <b-form-select v-model="perPage" :options="options"/>
                    </b-input-group>
                </div>
                <!-- <div class="col-sm-3"> -->
                    <b-pagination class="mt-3" size="sm" align="center" :total-rows="searchData.numFound" v-model="currentPage" :per-page="perPage">
                    </b-pagination>
                <!-- </div> -->
        </div>
        <div class="alert elevation-2 mb-2 p-1 text-center h5" role="alert"
             :class="getAlertClass()">
                {{getRestatedText()}}
        </div>
        <div class="bg-gray-light elevation-2 mb-2 p-1">
            <div class="row pb-1">
                <div class="col-6">
                    <span class="text-bold text-sm">Gene family</span>
                </div>
                <div class="col">
                    <span class="text-bold text-sm">Matched field</span>
                </div>
                <div class="col">
                    <span class="text-bold text-sm">Number of genes</span>
                </div>
            </div>
        </div>
        <div v-for="(data, i) in searchData.results"
             v-bind:class="[i%2==0 ? whiteBg : grayBg]"
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
                    this.setFilter(treeFilters);
                }
            },
            perPage: {
                handler (val, oldVal){
                    this.currentPage = 1;
                    this.treeFilters.rows = val;
                    this.setFilter(treeFilters);
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
                whiteBg: 'bg-white',
                grayBg: 'bg-gray-light',
                currentPage: 1,
                perPage: 10,
                options: [
                    { value: 5, text: '5 per page' },
                    { value: 10, text: '10 per page' },
                    { value: 20, text: '20 per page' },
                    { value: 50, text: '50 per page' }
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
              console.log(this.searchData);
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
                return "alert-success";
            }
        },
        components: {
            ResultItem
        }
    }

</script>

<style scoped>

</style>

