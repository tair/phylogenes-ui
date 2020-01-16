<template>
    <div class="row align-items-center justify-content-between">
        <div class="col-auto">
            <search-box ref="searchBox" 
                    v-on:search="onSearch" 
                    :defaultText="defaultSearchText"></search-box>
        </div>
        <div class="col-auto align-items-center">
            <b-dropdown v-b-tooltip.hover title="Operations" variant="white" class="bg-white" no-caret>
                <template slot="button-content">
                    <i @click="ddClicked" class="fas fa-tools fa-2x fa-fw"></i>
                </template>
                <b-dropdown-item v-for="item in dropdownMenu" :key="item.id" @click="ddMenuitemClicked(item.id)">
                    {{item.title}}
                </b-dropdown-item>
                <!-- <b-dropdown-item @click="exportXML">Download tree as PhyloXML</b-dropdown-item> -->
                <json-csv 
                    :data="csvTable.tableCsvData" 
                    :name="treeId+'.csv'" 
                    :fields="csvTable.tableCsvFields"
                >
                    <b-dropdown-item>Download gene table as CSV</b-dropdown-item>
                </json-csv>
            </b-dropdown>
            <button v-b-tooltip.hover title="Compact View" class="btn bg-white" @click="onDefaultView">
                <i class="fas fa-compress-arrows-alt fa-2x fa-fw"></i>
            </button>
            <button v-b-tooltip.hover title="Expand All" class="btn bg-white" @click="expandAll">
                <i class="fas fa-expand-arrows-alt fa-2x fa-fw"></i>
            </button>
            <button @mouseover="showLegendTip=true" @mouseout="showLegendTip=false" class="btn bg-white"
                    @click="showLegend" id="legendButton">
                <i :class="showLegendButtonIcon.buttonIcon + ' fa-2x  fa-fw'"></i>
                <b-tooltip :show.sync="showLegendTip" target="legendButton" placement="top">
                    {{showLegendButtonIcon.title}}
                </b-tooltip>  
            </button>
        </div>
    </div>
</template>

<script>
    import searchBox from '@/components/search/SearchBox';
    import { mapGetters, mapActions } from 'vuex';
    import * as types from '@/store/types_treedata';
    export default {
        name: 'treeLayoutMenu',
        components: {
            searchBox: searchBox,
        },
        props: [
            "treeId",
            "csvTable",
            "dropdownMenu"
        ],
        computed: {
            ...mapGetters({
                store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
            }),
            showLegendButtonIcon(){
                return this.legendIcon?
                {
                    title: 'Show Legend',
                    buttonIcon: 'fas fa-angle-double-up'
                }:
                {
                    title: 'Hide Legend',
                    buttonIcon: 'fas fa-angle-double-down'
                };
            }
        },
        data() {
            return {
                defaultSearchText: "",
                //Legend
                legendIcon: false,
                showLegendTip: false,
            }
        },
        watch: {
            store_getSearchTxtWthn: {
                handler: function (val, oldVal) {
                    if(val != null) {
                        this.defaultSearchText = val;
                    }
                },
                deep: true,
                immediate: true
            }
        },
        methods: {
            onSearch(text) {
                this.$emit('onSearch', text);
            },
            ddClicked() {
                this.$emit('ddItemClicked', -1);
            },
            ddMenuitemClicked(id) {
                this.$emit('ddItemClicked', id);
            },
            onDefaultView() {
                this.$emit('onDefaultView');
            },
            showLegend() {
                this.$emit('onShowLegend');
                this.legendIcon = !this.legendIcon;
            },
            expandAll() {
                this.$emit('expandAll');
            },
            onReset() {
                if(this.$refs.searchBox) {
                    this.$refs.searchBox.onReset();
                }
            }
        }
    }
</script>

<style scoped>

</style>