<template>
  <div>
    <div
      v-if="showWarning"
      class="row align-items-center justify-content-between"
    >
      <div class="announceUl">
        <div class="announce">
          You can remove unwanted species from the tree. Click the Tools icon
          and select Prune tree.
        </div>
      </div>
    </div>
    <div class="row align-items-center justify-content-between">
      <div class="col-auto">
        <search-box
          ref="searchBox"
          v-on:search="onSearch"
          :defaultText="defaultSearchText"
        ></search-box>
      </div>
      <div class="col-auto align-items-center">
        <b-dropdown
          v-b-tooltip.hover.bottom.o-300
          title="Operations"
          variant="white"
          class="bg-white"
          no-caret
        >
          <template slot="button-content">
            <i @click="ddClicked" class="fas fa-tools fa-2x fa-fw"></i>
          </template>
          <b-dropdown-item
            v-for="item in dropdown_default"
            :key="item.id"
            @click="ddMenuitemClicked(item.id)"
          >
            {{ item.title }}
          </b-dropdown-item>
        </b-dropdown>
        <b-dropdown
          v-b-tooltip.hover.bottom.o-300
          title="Downloads"
          variant="white"
          class="bg-white"
          no-caret
        >
          <template slot="button-content">
            <i @click="ddClicked" class="fas fa-download fa-2x fa-fw"></i>
          </template>
          <b-dropdown-item
            v-for="item in dropdown_downloads"
            :key="item.id"
            @click="ddMenuitemClicked(item.id)"
          >
            {{ item.title }}
          </b-dropdown-item>
        </b-dropdown>
        <button
          v-b-tooltip.hover.bottom.o300
          title="Compact View"
          class="btn bg-white"
          @click="onDefaultView"
        >
          <i class="fas fa-compress-arrows-alt fa-2x fa-fw"></i>
        </button>
        <button
          v-b-tooltip.hover.bottom.o300
          title="Expand All"
          class="btn bg-white"
          @click="expandAll"
        >
          <i class="fas fa-expand-arrows-alt fa-2x fa-fw"></i>
        </button>
        <button
          @mouseover="showLegendTip = true"
          @mouseout="showLegendTip = false"
          class="btn bg-white"
          @click="showLegend"
          id="legendButton"
        >
          <i :class="showLegendButtonIcon.buttonIcon + ' fa-2x  fa-fw'"></i>
          <b-tooltip
            :show.sync="showLegendTip"
            target="legendButton"
            placement="bottom"
            offset="o300"
          >
            {{ showLegendButtonIcon.title }}
          </b-tooltip>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import searchBox from '@/components/search/SearchBox'
import { mapGetters, mapActions } from 'vuex'
import * as types from '@/store/types_treedata'
export default {
  name: 'treeLayoutMenu',
  components: {
    searchBox: searchBox,
  },
  props: ['treeId', 'csvTable', 'dropdownMenu'],
  computed: {
    ...mapGetters({
      store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
      store_getTreeMetadata: types.TREE_GET_METADATA,
    }),
    dropdown_downloads() {
      return this.dropdownMenu.filter((m) => m.type == 'download')
    },
    dropdown_default() {
      return this.dropdownMenu.filter((m) => !m.type)
    },
    showLegendButtonIcon() {
      return this.legendIcon
        ? {
            title: 'Show Legend',
            buttonIcon: 'fas fa-angle-double-up',
          }
        : {
            title: 'Hide Legend',
            buttonIcon: 'fas fa-angle-double-down',
          }
    },
    showWarning() {
      console.log('showWarning ', this.store_getTreeMetadata.genesCount)
      return this.store_getTreeMetadata.genesCount > 500 ? true : false
    },
  },
  data() {
    return {
      defaultSearchText: '',
      //Legend
      legendIcon: false,
      showLegendTip: false,
      genesCount: null,
    }
  },
  watch: {
    store_getSearchTxtWthn: {
      handler: function (val, oldVal) {
        if (val != null) {
          this.defaultSearchText = val
        } else {
          this.defaultSearchText = ''
          this.onReset()
        }
      },
      deep: true,
      immediate: true,
    },
    store_getTreeMetadata: {
      handler: function (val, oldVal) {
        if (val) {
          // console.log(val)
          this.genesCount = val.genesCount
        }
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    onSearch(text) {
      this.$emit('onSearch', text)
    },
    ddClicked() {
      this.$emit('ddItemClicked', -1)
    },
    ddMenuitemClicked(id) {
      this.$emit('ddItemClicked', id)
    },
    onDefaultView() {
      this.$emit('onDefaultView')
    },
    showLegend() {
      this.$emit('onShowLegend')
      this.legendIcon = !this.legendIcon
    },
    expandAll() {
      this.$emit('expandAll')
    },
    onReset() {
      if (this.$refs.searchBox) {
        this.$refs.searchBox.onReset()
      }
    },
  },
}
</script>

<style scoped>
.announce {
  color: #ff7aff;
  background-color: whitesmoke;
  font-size: 16px;
  font-weight: 600;
}
.announce-link {
  color: #ff7aff !important;
  text-decoration: underline;
}
.announceUl {
  padding-left: 1rem;
  padding-right: 1rem;
  margin-bottom: 0.5rem;
}
</style>
