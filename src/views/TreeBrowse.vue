<template>
  <div class="browse">
    <div class="row">
      <div
        class="col-sm-12 col-md-4 col-lg-3 p-4 bg-lblue"
        style="height: 100vh; overflow: auto;"
      >
        <div v-if="showFilters()" class="py-3">
          <span
            v-for="species in this.treeFilters.species"
            class="badge badge-pill badge-danger mr-1 p-1"
          >
            {{ species }}
            <a
              href="#"
              @click="removeFilter('species', species)"
              class="text-white"
              ><i class="fas fa-times-circle"></i
            ></a>
          </span>
          <span
            v-for="organisms in this.treeFilters.organisms"
            class="badge badge-pill badge-info mr-1 p-1"
          >
            {{ organisms }}
            <a
              href="#"
              @click="removeFilter('organisms', organisms)"
              class="text-white"
              ><i class="fas fa-times-circle"></i
            ></a>
          </span>
          <span
            v-for="nodeTypes in this.treeFilters.nodeTypes"
            class="badge badge-pill badge-primary mr-1 p-1"
          >
            {{ nodeTypes }}
            <a
              href="#"
              @click="removeFilter('nodeTypes', nodeTypes)"
              class="text-white"
              ><i class="fas fa-times-circle"></i
            ></a>
          </span>
        </div>

        <i
          v-if="this.stateTreeIsLoading"
          class="fa fa-spinner fa-spin fa-6x p-5 text-primary"
        ></i>
        <div v-if="!this.stateTreeIsError && !this.stateTreeIsLoading">
          <search-filter :facets="stateTreeData.facets"></search-filter>
        </div>
        <div v-if="this.stateTreeIsError" class="text-danger pt-4 h5">
          Error occurred while reading data.
        </div>
      </div>

      <div
        class="col-sm-12 col-md-8 col-lg-9 px-4 bg-pggrey"
        style="height: 100vh; overflow: auto;"
      >
        <i
          v-if="this.stateTreeIsLoading"
          class="fa fa-spinner fa-spin fa-6x p-5 text-primary"
        ></i>
        <search-result
          v-if="showSearchResult()"
          :searchData="stateTreeData"
        ></search-result>
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
import SearchFilter from '@/components/search/SearchFilter'
import SearchResult from '@/components/search/SearchResult'

import * as types from '../store/types_tree'
import { mapGetters } from 'vuex'
import { mapActions } from 'vuex'

export default {
  components: {
    Relax,
    SiteMap,
    SearchFilter,
    SearchResult,
  },
  data() {
    return {
      treeFilters: null,
    }
  },
  created() {
    this.treeFilters = this.stateTreeFilters
    this.doSearch()
  },
  methods: {
    showSearchResult() {
      return !this.stateTreeIsError && !this.stateTreeIsLoading
    },
    removeFilter(type, val) {
      var arr = this.treeFilters[type]
      arr.splice(arr.indexOf(val), 1)
      this.stateAction_setSearchFilters(this.treeFilters)
      this.doSearch()
    },
    doSearch() {
      var payload = {
        searchText: this.stateSearchText,
        filters: this.stateTreeFilters,
      }
      this.stateAction_doSearch(payload)
    },
    showFilters() {
      if (this.stateTreeFilters.organisms.length > 0) {
        return true
      }
      if (this.stateTreeFilters.species.length > 0) {
        return true
      }
      return false
    },
    ...mapActions({
      stateAction_setSearchFilters: types.TREE_ACTION_SET_FILTER,
      stateAction_doSearch: types.TREE_ACTION_DO_SEARCH,
    }),
  },
  computed: {
    ...mapGetters({
      stateSearchText: types.TREE_GET_SEARCH_TEXT,
      stateTreeData: types.TREE_GET_DATA,
      stateTreeIsError: types.TREE_IS_ERROR,
      stateTreeIsLoading: types.TREE_IS_LOADING,
      stateTreeFilters: types.TREE_GET_FILTERS,
    }),
  },
  watch: {
    stateTreeFilters: {
      deep: true,
      handler: function (val, oldVal) {
        this.treeFilters = this.stateTreeFilters
      },
    },
  },
}
</script>

<style scoped>
.browse {
  background-color: #c0dead;
}
</style>
