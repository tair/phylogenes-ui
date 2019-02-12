<template>
    <div class="row">
      <div class="col-auto">
          <b-container fluid>
              <b-input-group size="sm" v-b-tooltip.hover :title=placeholder>
                  <input id="search" type="text" class="my-input" placeholder="Gene name, Gene ID, Uniprot ID"
                         v-model="searchText">
              </b-input-group>
          </b-container>
      </div>
      <div class="col-auto my-text">
          {{matchText}}
      </div>
      <div class="col-auto">
          <button type="submit" class="btn btn-inline" @click="onSearch()">
            <i class="fa fa-search"></i>
          </button>
          <button v-if="isSearched" type="submit" class="btn btn-inline" @click="onReset()">
            <i class="fa fa-times"></i>
          </button>
      </div>
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
      isSearched: false,
      placeholder: "Search by Gene Name, Gene ID or Uniprot ID"
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
          if(val[0] == -1) {
              this.onReset();
          }
      }
  }
},
methods: {
  onSearch() {
      if(this.searchText !== "") {
          this.isSearched = true;
          this.$emit('search', this.searchText);
      }
  },
  onReset() {
      this.searchText = "";
      this.isSearched = false;
      this.matchText = "";
      this.$emit('search', null);
  },
}
}
</script>
<style scoped>
    .my-input {
        display: block;
        width: 100%;
        padding: 0.375rem 0.75rem;
        font-size: 0.8rem;
        line-height: 1.5;
        color: #495057;
        background-color: #ffffff;
        background-clip: padding-box;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out, -webkit-box-shadow 0.15s ease-in-out;
    }
    input {
        border: 1px solid white;
    }
    input:focus{
        outline: none;
    }
    div.row {
        background-color: white;
    }
    .btn {
        box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.1) inset;
    }
    .btn .btn-inline {
        box-shadow: white;
        background-color: white;
        color: white;
    }
    .my-text {
        padding-top: 8px;
        font-size: small;
        color: gray;
    }
</style>