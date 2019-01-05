<template>

        <div class="d-flex flex-column">
            <div class="d-flex flex-row">
                <div class="d-flex flex-column"><p>Search for gene trees by ID, symbol or keyword</p></div>
                <div class="d-flex flex-column pl-3"><a href="#"><i class="fas fa-info-circle fa-lg" v-b-popover="'info text'"></i></a></div>
            </div>
            <div class="d-flex flex-row">
                <div class="input-group-prepend">
                    <span class="input-group-text" id="basic-addon1">
                        <i class="fa fa-search"></i>
                    </span>
                </div>
                <input type="text" class="form-control elevation-0" id="treeSearchTxt"
                       v-model="searchText"
                       style="width: 100%; background-color: #ffb663; color: white; border: 0px;"
                       aria-describedby="treeSearch"
                       placeholder="search by UniProt ID, gene ID, gene symbol or keyword"
                       />
                <button class="btn btn-info mx-2" @click.prevent="onSearch()">
                    Go
                </button>
                <button class="btn btn-info" @click.prevent="onReset()">
                    Reset
                </button>
            </div>
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
                setSearchText: types.TREE_ACTION_SET_SEARCH
            }),
            onSearch() {

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