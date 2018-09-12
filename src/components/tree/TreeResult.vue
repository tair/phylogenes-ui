<template>
    <div>
        <div class="row">
            <div class="col text-sm">
                <div class="text-muted">Query time: {{ treeData.queryTime }} ms</div>
            </div>
            <div class="col">

                <ul class="pagination pagination-sm justify-content-end">
                    <div class="text-primary p-1 pr-3 text-sm">Results found: {{ treeData.numFound }}</div>

                    <li :class="['page-item', {'disabled': currentPage == 1}]">
                        <a class="page-link" href="#" @click="gotoPage(1)">
                            <i class="fas fa-angle-double-left"></i>
                        </a>
                    </li>
                    <li :class="['page-item', {'disabled': currentPage == 1}]">
                        <a class="page-link" href="#" @click="gotoPage(currentPage - 1)">
                            <i class="fas fa-angle-left"></i>
                        </a>
                    </li>

                    <li v-if="currentPage == noPages" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage -  4)">{{ currentPage -  4 }}</a></li>
                    <li v-if="currentPage == noPages || currentPage == noPages - 1" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage -  3)">{{ currentPage -  3 }}</a></li>

                    <li v-if="currentPage - 2 > 0" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage -  2)">{{ currentPage -  2 }}</a></li>
                    <li v-if="currentPage - 1 > 0" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage -  1)">{{ currentPage -  1 }}</a></li>

                    <li class="page-item active"><a class="page-link" href="#">{{ currentPage }}</a></li>

                    <li v-if="currentPage + 1 <= noPages" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage +  1)">{{ currentPage +  1 }}</a></li>
                    <li v-if="currentPage + 2 <= noPages" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage +  2)">{{ currentPage +  2}}</a></li>

                    <li v-if="currentPage == 1 || currentPage == 2" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage + 3)">{{ currentPage +  3 }}</a></li>
                    <li v-if="currentPage == 1" class="page-item"><a class="page-link" href="#" @click="gotoPage(currentPage + 4)">{{ currentPage + 4 }}</a></li>

                    <li :class="['page-item', {'disabled': currentPage == noPages}]" class="page-item">
                        <a class="page-link" href="#" @click="gotoPage(currentPage + 1)" aria-label="Next">
                            <i class="fas fa-angle-right"></i>
                        </a>
                    </li>
                    <li :class="['page-item', {'disabled': currentPage == noPages}]" class="page-item">
                        <a class="page-link" href="#" @click="gotoPage(noPages)" aria-label="Next">
                            <i class="fas fa-angle-double-right"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div v-for="data in treeData.results">
            <result-item :item="data"></result-item>
        </div>
    </div>
</template>

<script>
    import ResultItem from '@/components/tree/TreeResultItem'

    import * as types from '../../store/types_tree';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    export default {
        data() {
            return {
                treeFilters: null
            }
        },
        computed: {
            noPages() {
                return Math.ceil(this.treeData.numFound / this.treeData.rows);
            },
            currentPage() {
                if(this.treeData.startRow == 0)
                    return 1;

                return Math.floor(this.treeData.startRow / this.treeData.rows) + 1;
            },
            ...mapGetters({
                stateTreeFilters: types.TREE_GET_FILTERS,
            })
        },
        created() {
            this.treeFilters = this.stateTreeFilters;
        },
        methods: {
            ...mapActions({
                stateTreePaginate: types.TREE_ACTION_PAGINATE
            }),
            gotoPage(page) {

                if(page === 0 || page > this.noPages || this.currentPage === page)
                    return;

                console.log('Current page: ' + this.currentPage);
                console.log('Goto page: ' + page);

                this.treeFilters.startRow = (page - 1) * this.treeFilters.rows;
                this.stateTreePaginate(this.treeFilters);
            }
        },
        components: {
            ResultItem
        },
        props: {
            treeData: {
                type: Object,
                required: true
            }
        },
        watch: {
            treeData: {
                immediate: true,
                handler (val, oldVal) {
                    if(val.numFound == 1) {
                        // console.log();
                        this.$router.push({path: 'tree/' + val.results[0].id})
                    }
                }
            }
        }
    }

</script>

<style scoped>

</style>

