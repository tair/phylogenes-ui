<template>
    <div>

        <!-- Fixed navbar -->
        <nav id="navbar2" class="navbar navbar-expand-md navbar-light fixed-top elevation-2 bg-success">
            <a class="navbar-brand" href="#">
                <i class="fab fa-pagelines fa-2x ml-3 mr-2"></i>
                Phylogenes
            </a>
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

<!--                     <li class="nav-item dropdown pr-2">
                        <a class="nav-link dropdown-toggle" style="font-size: 15px" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i class="fas fa-cogs"></i>
                        </a>
                        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
                            <router-link to="/about">
                                <a class="dropdown-item">
                                    <span>About</span>
                                </a>
                            </router-link>
                            <a class="dropdown-item" href="#">Action</a>
                            <a class="dropdown-item" href="#">Another action</a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="#">Something else here</a>
                        </div>
                    </li> -->

                    <router-link to="/about" tag="li">
                        <a class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="About Us">
                            About
                        </a>
                    </router-link>

                    <router-link to="/help" tag="li">
                        <a class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="Help">
                            Help
                        </a>
                    </router-link>

<!--                     <router-link to="/tree" tag="li">
                        <a class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="Explore trees">
                            <i class="fas fa-tree"></i>
                        </a>
                    </router-link> -->

                    <router-link to="/contact" tag="li">
                        <a class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="Contact Us">
                            Contact
                        </a>
                    </router-link>

                    <li>
                        <form class="nav-link form-inline my-2 my-lg-0" v-on:submit.prevent="onSearch()">
                            <input class="form-control mr-sm-2 form-control-sm"
                                   v-model="searchText"
                                   style="background-color: #B9CDA0; border: none;"
                                   type="text" placeholder="search by UniProt ID, gene ID, gene symbol or keyword" aria-label="Search">
                            <button class="btn btn-sm btn-success mx-2" @click.prevent="onSearch()">
                                Go
                            </button>
                            <button class="btn btn-sm btn-success" @click.prevent="onReset()">
                                Reset
                            </button>
                        </form>
                    </li>
<!--                     <router-link to="/login" tag="li">
                        <a class="nav-link pr-3" style="font-size: 15px"  data-toggle="tooltip" title="Login with ORCID">
                            <i class="fas fa-sign-in-alt"></i>
                        </a>
                    </router-link> -->

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
                resetSearchText: types.TREE_ACTION_RESET_SEARCH
            }),
            initRoute() {
                this.resetSearchText();
            },
            onSearch() {
                this.setSearchText(this.searchText);
                this.$router.push('tree');
                this.searchText = null;
            },
            onReset() {
                this.searchText = null;
            }
        }
    }
</script>