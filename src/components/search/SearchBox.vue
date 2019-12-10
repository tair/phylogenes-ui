<template>
  <div class="col-sm-12">
    <div class="row bg-mblue">
      <b-input-group class="my-1">
        <b-input-group-prepend class="mx-2 align-items-center">
          Search within tree
        </b-input-group-prepend>
        <input id="search" type="text" class="my-input" placeholder="Gene name, Gene ID, Uniprot ID"
                         v-model="searchText">
        <div v-if="matchText" class="col-auto my-text">
          {{compMatchText}}
          <button class="btn btn-inline" @click="skipUp()">
            <i class="fa fa-angle-up"></i>
          </button>
          <button class="btn btn-inline" @click="skipDown()">
            <i class="fa fa-angle-down"></i>
          </button>
        </div>
        <div>
          
        </div>
        <b-input-group-append>
          <button type="submit" class="btn btn-inline bg-mblue" @click="onSearch()">
            <i class="fa fa-search"></i>
          </button>
          <button v-if="isSearched" type="submit" class="btn btn-inline bg-mblue" @click="onReset()">
            <i class="fa fa-times"></i>
          </button>
        </b-input-group-append>
      </b-input-group>
    </div>
  </div>
</template>
<script>

import * as types from '@/store/types_treedata';
import {mapActions, mapGetters} from 'vuex';

export default {
name: "searchBox",
props: ['defaultText'],
data() {
  return {
      searchText: "",
      matchText: "",
      isSearched: false,
      placeholder: "Search by Gene Name, Gene ID or Uniprot ID",
      currIdx: 1
  }
},
computed: {
  ...mapGetters({
      store_matchedNodes: types.TREE_GET_MATCHED_NODES
  }),
  compMatchText() {
    return this.matchText;
  }
},
watch: {
  //Set a default search text (Called when searched from outside the tree layout)
  defaultText: {
      handler: function (val, oldVal) {
         this.searchText = this.defaultText;
         this.isSearched = true;
      }
  },
  store_matchedNodes: {
      handler: function (val, oldVal) {
          if(!val.allMatchedNodes) {
            this.onReset();
            return;
          }
          if(this.isSearched) {
            this.currIdx = val.currIdx;
            this.matchText = val.currIdx+1 + "/" + val.allMatchedNodes.length;
          }
          if(val[0] == -1) {
              this.onReset();
          }
      },
      deep: true
  }
},
methods: {
  ...mapActions({
    store_setTreeMatchedNodesIdx: types.TREE_ACTION_SET_MATCHED_NODES_CURRIDX
  }),
  onSearch() {
      this.matchText = "";
      this.currIdx = 0;
      this.store_setTreeMatchedNodesIdx(this.currIdx);
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
  skipUp() {
    let val = this.store_matchedNodes.allMatchedNodes;
    if(this.currIdx != 0) {
      this.currIdx -= 1;
      this.matchText = this.currIdx+1 + "/" + val.length;
      this.store_setTreeMatchedNodesIdx(this.currIdx);
    }
  },
  skipDown() {
    let val = this.store_matchedNodes.allMatchedNodes;
    if(this.currIdx != val.length-1) {
      this.currIdx += 1;
      this.matchText = this.currIdx+1 + "/" + val.length;
      this.store_setTreeMatchedNodesIdx(this.currIdx);
    }
  }
}
}
</script>
<style scoped>
    .my-input {
        display: block;
        padding: 0.375rem 0.75rem;
        font-size: 0.8rem;
        line-height: 1.5;
        color: #495057;
        background-color: #ffffff;
        background-clip: padding-box;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out, -webkit-box-shadow 0.15s ease-in-out;
        width: 220px;
    }
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus{
      transition: background-color 5000s ease-in-out 0s;
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
        padding: 0.375rem 0.75rem;
        font-size: 0.8rem;
        line-height: 1.5;
        background-color: #ffffff;
        font-size: small;
        color: gray;
    }
</style>