<template>
    <div class=" elevation-0">

        <div class="d-flex flex-column p-4 bg-info">
            <h2>Tree Search</h2>
            <p>Search by UniProt ID, keyword, Panther family name.</p>
            <form>
                <div class="form-group">
                    <input type="text" class="form-control elevation-0 float-right" id="treeSearchTxt"
                           v-model="searchText"
                           style="width: 100%; background-color: #7a5dad; color: white; border: 0px;"
                           aria-describedby="treeSearch"><br>
                    <button class="float-right btn btn-sm btn-danger mt-2" @click.prevent="onSearch()">
                        <i class="fa fa-search mr-2"></i>Search
                    </button>
                </div>
            </form>
        </div>
        <div class="d-flex flex-column p-4 bg-warning">
            <h2>Search by sequence</h2>
            <p>Enter a single protein sequence.</p>
            <form>
                <div class="form-group">
                <textarea class="form-control elevation-0 text-dark" id="seqSearchTxt"
                  style="width: 100%; background-color: #ffb663; color: white; border: 0px;"
                  rows="4"></textarea>
                    <button class="float-right btn btn-sm btn-info mt-2">
                        <i class="fa fa-search mr-2"></i>Search
                    </button>
                </div>
            </form>
        </div>
        <div class="d-flex align-items-end flex-column p-4 bg-danger">
            <div class="mb-1"><a href="">Explore a sample tree <i class="fas fa-angle-double-right"></i></a></div>
            <div class="mb-1"><a href="">Upload your own tree <i class="fas fa-angle-double-right"></i></a></div>
            <div class="mb-1"><a href=""class="text-white">What's new? <i class="fas fa-angle-double-right"></i></a></div>
            <div class="mb-1"><a href=""class="text-white">View species tree <i class="fas fa-angle-double-right"></i></a></div>
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
                this.searchText = null;
            }
        }
    }
</script>

<style scoped>

</style>