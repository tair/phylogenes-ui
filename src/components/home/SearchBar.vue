<template>

        <div class="d-flex flex-column bg-mblue p-3">
            <div class="d-flex flex-row">
                <div class="d-flex flex-column"><p>Search gene family</p></div>
            </div>
            <form @submit.prevent="onSearch()">
            <div class="d-flex flex-row">
                <input type="text" class="form-control elevation-0" id="treeSearchTxt"
                       v-model="searchText"
                       style="border: 0px;"
                       aria-describedby="treeSearch"
                       placeholder="search by UniProt ID, gene ID, gene symbol or keyword"
                       />
                <button class="btn btn-pggrey ml-2" @click.prevent="onSearch()">
                    <i class="fa fa-search"></i>
                </button>
                <button class="btn btn-pggrey ml-2" @click.prevent="onReset()">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            </form>
        </div>
</template>

<script>
    import * as types from '../../store/types_tree';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    export default {
        name: "SearchBar",
        data() {
            return {
                searchText: null
            }
        },
        created() {
        },
        computed: {
            ...mapGetters({

            })
        },
        methods: {
            ...mapActions({
                setSearchText: types.TREE_ACTION_SET_SEARCH,
                resetFilter: types.TREE_ACTION_RESET_FILTER,
            }),
            onSearch() {
                this.resetFilter();
                this.setSearchText(this.searchText);
                this.$router.push('tree');
            },
            onReset() {
                this.searchText = null;
            }
        }
    }
</script>

<style scoped>

</style>