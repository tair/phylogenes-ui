<template>
    <div class="info-form" @click.prevent="">
        <form action="" class="form-inline justify-content-center">
            <div class="form-group">
                <input type="text" class="form-control" placeholder="Gene name"
                       v-model="searchText">
                <span class="match" @click="">
                    {{matchText}}
                </span>
            </div>

            <button type="submit" class="btn btn-inline" @click="onSearch()">
                <i :class="getSearchIcon()"></i>
            </button>
        </form>
    </div>
</template>
<script>
    import * as types from '@/store/types_treedata';
    import {mapActions, mapGetters} from 'vuex';

    export default {
        name: "searchBox",
        data() {
            return {
                searchText: "",
                matchText: "",
                isSearched: false
            }
        },
        computed: {
            ...mapGetters({
                store_matchedNodes: types.TREE_GET_MATCHED_NODES
            })
        },
        watch: {
            store_matchedNodes: {
                handler: function (val, oldVal) {
                    if(this.isSearched) {
                        this.matchText = val.length + " Matched";
                    }
                }
            }
        },
        methods: {
            onSearch() {
                if(!this.isSearched && this.searchText != "") {
                    this.isSearched = true;
                    this.$emit('search', this.searchText);
                } else {
                    this.searchText = "";
                    this.isSearched = false;
                    this.matchText = "";
                    this.$emit('search', null);
                }

            },
            getSearchIcon() {
                if(this.isSearched) {
                    return 'fa fa-times';
                } else {
                    return 'fa fa-search';
                }
            }
        }
    }
</script>
<style scoped>
    input {
        border: 1px solid white;
    }
    .btn {
        box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.1) inset;
    }
    .btn .btn-inline {
        box-shadow: white;
        background-color: white;
        color: white;
    }
    .form-group {
        background-color: white;
    }
    .match {
        text-decoration-color: #9E9E9E;
    }
</style>