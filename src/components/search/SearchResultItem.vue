<template>
  <div>
    <div class="row">
      <div class="col-6">
        <!-- <router-link :to="{ path: '/tree/' + this.item.id }" tag="a"> -->
        <span @click="openTreePage(item)" class="text-danger h6 cursor-pointer">
          {{ getFamilyName() }}</span
        >
        <!-- </router-link> -->
        <span class="text-dark h-75"> [{{ item.id }}]</span>
      </div>
      <div class="col">
        <span class="text-dark h-75">{{ getHighlightedFields() }}</span>
      </div>
      <div class="col">
        <span>{{
          this.item.uniprot_ids ? this.item.uniprot_ids.length : 0
        }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import * as types from '../../store/types_treedata'

export default {
  name: 'SearchResultItem',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  methods: {
    ...mapActions({
      store_setTreeMetadata: types.TREE_ACTION_SET_METADATA,
    }),
    openTreePage(item) {
      // window.open('/tree/' + item.id);
      this.$router.push('/tree/' + item.id)
    },
    getFamilyName() {
      if (this.item.family_name) {
        return this.item.family_name[0]
      }
      return ''
    },
    getHighlightedFields() {
      var fl = ''
      if (!this.item.hl) {
        console.log('Error! No highlighted field found!')
        return fl
      }

      if (this.item.hl[0] != this.item.id) {
        console.log('Error')
        return fl
      }
      let keys = Object.keys(this.item.hl[1])
      if (keys.length > 0) {
        var names = ''
        keys.forEach((key, i) => {
          names += this.item.hl[1][key]
          names += ', '
          fl += this.mapFieldToDisplayName(key)
          if (keys.length > 1) {
            if (i != keys.length - 1) {
              fl += ', '
            }
          }
        })
      }
      return fl
    },
    mapFieldToDisplayName(fl) {
      var displayName = ''
      switch (fl) {
        case 'gene_symbols':
          displayName = 'gene symbol'
          break
        case 'sf_names':
          displayName = 'subfamily name'
          break
        case 'family_name':
          displayName = 'family name'
          break
        default:
          console.log('Error! Unknown field name matched')
      }
      return displayName
    },
    getFamilyName() {
      if (this.item.family_name) {
        return this.item.family_name[0]
      } else {
        return 'FAMILY NOT NAMED'
      }
    },
  },
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.gray-box {
  background-color: #fbfbfb;
  border: 1px solid #efefef;
  height: 80px;
  overflow-y: scroll;
}
</style>
