<template>
    <div>

        <!-- Fixed navbar -->
        <nav id="navbar2" class="navbar navbar-expand-md navbar-light fixed-top elevation-2 bg-dblue">
            <a class="my-logo" href="/">
                <img width="75" height="48" src="../../src/assets/img/phy-logo2.png" alt="">
            </a>
            <div>
                <ul class="announceUl">
                    <li>
                        <div class="announce"><a class="announce-link" target="_blank" href="https://www.arabidopsis.org/doc/news/breaking_news/140#id194">Free Webinar</a> (20min presentation followed by Q&A) </div>
                    </li>
                    <li>
                        <div class="announce">Thursday, April 2nd, 10AM PST   Click to join: <a class="announce-link" target="_blank" href="https://chime.aws/4121492755">https://chime.aws/4121492755</a> </div>
                    </li>
                </ul>
            </div>
            
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                
                <ul class="navbar-nav ml-auto">
                    
                    
                    <router-link to="/" tag="li">
                        <a class="nav-link pr-3 active" style="font-size: 15px"  data-toggle="tooltip" title="Home">
                            Home
                        </a>
                    </router-link>

                    <a href="https://conf.arabidopsis.org/display/PHGSUP/About+PhyloGenes" target="_blank" class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="About Us">
                        About
                    </a>

                    <a href="https://conf.arabidopsis.org/display/PHGSUP" target="_blank" class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="Help">
                        Help
                    </a>

                    <router-link to="/contact" tag="li">
                        <a class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="Contact Us">
                            Contact
                        </a>
                    </router-link>

                    <li>
                        <form class="nav-link form-inline my-2 my-lg-0" @submit.prevent="onSearch()">
                            <input class="form-control mr-sm-2 form-control-sm nav-input-width"
                                   v-model="searchText"
                                   style="border: none;"
                                   type="text" placeholder="search by UniProt ID, gene ID, gene symbol or keyword" aria-label="Search">
                            <button class="btn btn-sm btn-pggrey mr-2" @click.prevent="onSearch()">
                                <i class="fa fa-search"></i>
                            </button>
                            <button class="btn btn-sm btn-pggrey" @click.prevent="onReset()">
                                <i class="fa fa-times"></i>
                            </button>
                        </form>
                    </li>

                </ul>

            </div>
        </nav>
    </div>
</template>
<script>
    import * as types from '@/store/types_tree';
    import {mapActions} from 'vuex';
    import {mapGetters} from 'vuex';

    export default {
        name: "TopNavBar",
        data() {
            return {
                treeFilters: null,
                searchText: null
            }
        },
        created() {
            this.treeFilters = this.stateTreeFilters;
        },
        computed: {
            ...mapGetters({
                stateTreeFilters: types.TREE_GET_FILTERS,
            })
        },
        methods: {
            ...mapActions({
                setSearchText: types.TREE_ACTION_SET_SEARCH,
                resetFilter: types.TREE_ACTION_RESET_FILTER,
                stateAction_doSearch: types.TREE_ACTION_DO_SEARCH,
            }),
            onSearch() {
                this.resetFilter();
                this.setSearchText(this.searchText);
                this.stateAction_doSearch();
                this.$router.push('/tree');
                this.searchText = null;
            },
            onReset() {
                this.searchText = null;
            }
        }
    }
</script>
<style scoped>
    .my-logo {
        position: absolute;
        padding: 5px;
    }
    .nav-input-width {
        width: 305px !important;
    }
    .announce {
        color: #FFD966;
        font-size: 14px;
        font-weight: 600;
    }
    .announce-link {
        color: #FFD966;
        text-decoration: underline;
    }
    .announceUl {
        list-style-type: none;
        padding-left: 7rem;
        margin-bottom: 0.5rem;;
    }
</style>