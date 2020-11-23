<template>
  <div id="parent" :style="{ width: window.width + 'px', height: window.height - 50 + 'px' }">
    <!-- GO Annotations Info modal popup window -->
    <modal v-if="showPopup" @close="showPopup = false">
      <div slot="header">{{ popupHeader }}</div>
      <template slot="body" slot-scope="props">
        <popupTable v-if="popupData.length > 0" :data="popupData" :cols="popupCols"></popupTable>
        <div v-if="popupData.length === 0">
          <i>No Go Annotations for this gene!</i>
        </div>
      </template>
    </modal>
    <!-- Data Panel Edit modal popup window -->
    <modal v-if="showDPEPopup" @close="showDPEPopup = false">
      <div slot="header">
        {{ DPEpopupHeader }}
        <span class="text-danger">({{ colsHidden }} Cols Hidden)</span>
      </div>
      <template slot="body" slot-scope="props">
        <dataPanelEdit
          :columns="editColsList"
          v-on:check-change="onAnyDPECheckboxChange"
          v-on:uncheck-all="onDPEUncheckAll"
          v-on:check-all="onDPECheckAll"
          v-on:move-up="onMoveUp"
          v-on:move-down="onMoveDown"
        ></dataPanelEdit>
      </template>
      <template slot="footer">
        <button class="modal-default-button" @click="onTableEdit">Update Table</button>
        <button class="modal-default-button" @click="showDPEPopup = false">Close</button>
      </template>
    </modal>
    <!-- MSA Legend Popup -->
    <div v-if="showMsaLegend" class="legend-box">
      <msa-legend></msa-legend>
    </div>
    <!-- Tree Node Click Popup --->
    <modal v-if="showPopup_treeNode" @close="showPopup_treeNode = false">
      <div slot="header">Menu</div>
      <template slot="body" slot-scope="props">
        <button v-if="downloading_ortho != 'downloaded'" @click=downloadOrtholog()>Download Plant Orthologs</button>
        <span v-if="downloading_ortho == 'downloading'"> Downloading... </span>
        <json-csv
          v-if="downloading_ortho == 'downloaded'"
          :data="orthoTable.tableCsvData"
          name="ortholog.csv"
          :fields="orthoTable.tableCsvFields"
        >
          <button v-if="downloading_ortho == 'downloaded'">Csv ready for download</button>
        </json-csv>
      </template>
      <template slot="footer">
        <button class="modal-default-button" @click="showPopup_treeNode = false">Close</button>
      </template>
    </modal>
    <!-- Main Table -->
    <table class="mainTable">
      <thead id="head" ref="thead">
        <button v-if="msaTab" class="btn bg-white float-right msalegendbtn" @click="toggleLegend">
          <span class="text-danger">
            {{
            showMsaLegend ? 'Hide Legend' : 'Show Legend'
            }}
          </span>
        </button>
        <tr id="mainTr">
          <th :class="getThClasses('tree', -1)">
            <tree-layout-menu
              ref="tlmenu"
              :csvTable="csvTable"
              :dropdownMenu="treeDropdownMenu"
              :treeId="treeId"
              v-on:ddItemClicked="ddClicked"
              v-on:onSearch="onSearchWithinTree"
              v-on:onDefaultView="onDefaultView"
              v-on:expandAll="expandAll"
              v-on:onShowLegend="showLegend"
            ></tree-layout-menu>
          </th>
          <th v-for="(col, i) in colsToRender" :key="i" :class="getThClasses(col, i)">
            <div v-if="col.type && col.type=='first_mf'" class="annoPopver">
              <b-button id="annoPopover_mf" href="#" tabindex="0" variant="flat">
                <i class="fas fa-info-circle fa-lg"></i>
                <popover
                  :text="popoverGO_mfText"
                  title="GO Annotations - Molecular Function"
                  placement="right"
                  target="annoPopover_mf"
                ></popover>
              </b-button>
              <div v-if="i==prefix_anno" class="aspectInfo">
                <span
                  v-b-tooltip.hover.top.o100
                  class="anno_type text-danger"
                  title="Molecular Function"
                >F</span>
              </div>
            </div>
            <div v-if="col.type && col.type=='first_bp'" class="annoPopver">
              <b-button id="annoPopover_bp" href="#" tabindex="0" variant="flat">
                <i class="fas fa-info-circle fa-lg"></i>
                <popover
                  :text="popoverGO_bpText"
                  title="GO Annotations - Biological Process"
                  placement="right"
                  target="annoPopover_bp"
                ></popover>
              </b-button>
              <div v-if="i==prefix_anno + n_anno_mf" class="aspectInfo">
                <span
                  v-b-tooltip.hover.top.o100
                  title="Biological process"
                  class="anno_type text-danger"
                >P</span>
              </div>
            </div>
            <b-button
              v-if="showPopover(col.label)"
              :id="col.label + 'id'"
              href="#"
              tabindex="0"
              variant="flat"
            >
              <i class="fas fa-info-circle fa-lg"></i>
            </b-button>
            <popover
              v-if="showPopover(col.label)"
              :text="getPopoverText(col.label)"
              :title="col.label"
              placement="right"
              :target="col.label + 'id'"
            ></popover>
            <tablecell :content="getHeader(col, i)"></tablecell>
            <!-- First fixed table column "Gene" -->
            <div v-if="i == 0">
              <button
                v-if="showDPEOption"
                class="btn bg-white showCogBtn"
                v-b-tooltip.hover.top.o100
                title="Customize gene info table"
                @click="showPanel"
              >
                <i class="fas fa-cog"></i>
              </button>
              <button class="btn btn-link showMsaBtn" @click="toggleTabs">
                <span class="text-danger">
                  {{
                  msaTab ? 'Show Gene Info >' : 'Show MSA >'
                  }}
                </span>
              </button>
              <button v-if="showDPEOption" class="btn btn-link showHiddenVal" @click="showPanel">
                <span class="text-danger">{{ colsHidden }} Cols Hidden</span>
              </button>
            </div>
          </th>
        </tr>
      </thead>
      <tbody id="body" ref="tbody">
        <tr>
          <td :rowspan="treeRowSpan" :class="getTdClasses('tree', -1, -1)">
            <treelayout
              :jsonData="treeDataFromProp"
              :heightFP="rowsHeight"
              :singleRowHeight="MAX_ROW_HEIGHT"
              ref="treeLayout"
              v-on:init-tree="onTreeInit"
              v-on:get-table-csv-data="getTableCsvData"
              v-on:updated-tree="onTreeUpdate"
              v-on:click-node="onClickNode"
            ></treelayout>
          </td>
        </tr>
        <tr v-if="this.isLoading">
          <i class="fa fa-spinner fa-spin fa-6x p-5 text-primary"></i>
        </tr>
        <tr v-else v-for="(row, row_i) in rowsToRender" :key="row_i">
          <td
            v-for="(key, i) in colsToRender"
            :key="key.label"
            @click="tdClicked(key.label, row)"
            :class="getTdClasses(key.label, row[key.label], i)"
          >
            <tablecell :content.sync="rowsToRender[row_i][key.label]"></tablecell>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import * as d3 from 'd3'
import axios from 'axios/index'
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'
import { setTimeout } from 'timers'
import Vue from 'vue'

import * as types from '../../store/types_treedata'
import popupTable from './PopupTable'
import dataPanelEdit from './DataPanelEdit'
import customModal from '@/components/modal/CustomModal'
import baseCell from '@/components/table/cells/BaseTableCell'
import msaLegend from '../table/MsaLegend'
import treelayout from '@/components/tree/TreeLayout'
import searchBox from '@/components/search/SearchBox'
import treeLayoutMenu from '@/components/menu/TreeLayoutMenu'

export default {
  name: 'tablelayout',
  props: [
    'treeDataFromProp',
    'colsFromProp',
    'headerMap', //Map: ['Original Col Name': 'Updated Col Name']
    'treeId',
    'csvTable'
  ],
  components: {
    treelayout: treelayout,
    popupTable: popupTable,
    dataPanelEdit: dataPanelEdit,
    searchBox: searchBox,
    modal: customModal,
    tablecell: baseCell,
    msaLegend: msaLegend,
    treeLayoutMenu: treeLayoutMenu
  },
  data() {
    return {
      isLoading: false,
      origColsToRender: [],
      colsToRender: [],
      defaultColsToHide: [],
      rowsToRender: [],
      lazyLoad: true,
      rowsScrolled: 0,
      n_annotations: 0,
      n_anno_bp: 0,
      n_anno_mf: 0,
      prefix_anno: 2,
      msaTab: false,
      window: {
        width: 0,
        height: 0
      },
      ORIG_ROW_HEIGHT: 35,
      MAX_ROW_HEIGHT: 35,
      //Tree
      treeRowSpan: 100,
      rowsHeight: 1000,
      treeDropdownMenu: [
        { id: 0, title: 'Download tree as PhyloXML' },
        // {id: 1, title: "Download gene table as CSV"},
        { id: 2, title: 'Highlight tree by organism' },
        { id: 3, title: 'Prune tree by organism' },
        { id: 4, title: 'Save tree image as PNG' },
        { id: 5, title: 'Save tree image as SVG' }
      ],
      //Popup
      showPopup: false,
      showPopup_treeNode: false,
      popupHeader: '',
      popupCols: ['GO term', 'Evidence description', 'Reference', 'More'],
      popupData: [],
      //DPE Popup
      showDPEOption: true,
      showDPEPopup: false,
      DPEpopupHeader: 'Customize gene info table',
      showMsaLegend: false,
      editColsList: [],
      editedOnce: false,
      colsHidden: 0,
      //ortolog
      ORTHO_MAPPING_PANTHER_API:
        process.env.VUE_APP_TOMCAT_URL + '/panther/orthomapping',
      //CSV
      tableCsvData: [],
      tableCsvFields: [
        'Uniprot ID',
        'Gene',
        'Gene ID',
        'Gene name',
        'Organism',
        'Protein name',
        'Subfamily name'
      ],
      //Table CSV
      orthoTable: {
        tableCsvData: [],
        tableCsvFields: [
          'Uniprot ID',
          'Gene ID',
          'Organism',
          'Ortholog type'
        ]
      },
      downloading_ortho: 'waiting',
      selectedNodeForOrtho: null,
      //Popover
      popover1Text:
        'This information was extracted from GOA <a href="https://www.ebi.ac.uk/GOA/" target="_blank">(https://www.ebi.ac.uk/GOA/)</a>. Only Molecular Function annotations with Experimental Evidence are shown.',
      popover2Text:
        'A gene symbol that is extracted from the GeneName filed of a fasta header in the UniProt protein fasta file <a href="https://www.uniprot.org/help/fasta-headers" target="_blank">(https://www.uniprot.org/help/fasta-headers)</a>.',
      popover3Text:
        'A gene ID is a canonical accession extracted from the Reference Proteomes gene2acc gene mapping file <a href="https://www.ebi.ac.uk/reference_proteomes" target="_blank">(https://www.ebi.ac.uk/reference_proteomes)</a>.',
      popover4Text:
        'This information was extracted from the ProteinName filed of a fasta header in the UniProt protein fasta file <a href="https://www.uniprot.org/help/fasta-headers" target="_blank">(https://www.uniprot.org/help/fasta-headers)</a>.',
      popover5Text:
        'The name of a subfamily is transferred from the representative member of the subfamily <a href="https://conf.arabidopsis.org/display/PHGSUP/FAQ" target="_blank">(see more).</a>',
      popoverGO_mfText:
        'GO Molecular Function annotations (from <a href="http://geneontology.org/" target="_blank">http://geneontology.org/</a>). A yellow flask icon indicates evidence by experiment and a green tree icon indicates inference by biological ancestor.',
      popoverGO_bpText:
        'GO Biological Process annotations (from <a href="http://geneontology.org/" target="_blank">http://geneontology.org/</a>). A yellow flask icon indicates evidence by experiment and a green tree icon indicates inference by biological ancestor.'
    }
  },
  created() {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    ...mapGetters({
      store_tableData: types.TABLE_GET_DATA,
      store_getCenterNode: types.TREE_GET_CENTER_NODE,
      store_annoMapping: types.TREE_GET_ANNO_MAPPING,
      store_getSearchTxtWthn: types.TREE_GET_SEARCHTEXTWTN,
      store_getTableIsLoading: types.TABLE_GET_ISTABLELOADING,
      store_getTableHiddenCols: types.TABLE_GET_HIDDENCOLS
    })
  },
  watch: {
    store_tableData: {
      handler: function(val, oldVal) {
        //This is zero, when a new tree is reloaded.
        if (val && val.length == 0) {
          this.resetTable()
        } else {
          this.initTable()
        }
      },
      deep: true,
      immediate: true
    },
    store_getTableIsLoading: {
      handler: function(val, oldVal) {
        if (val) {
          this.isLoading = val
          if (this.isLoading) {
            this.tableRendering = true
          }
        } else {
          this.tableRendering = false
        }
      },
      deep: true,
      immediate: true
    },
    colsFromProp: {
      handler: function(val, oldval) {
        this.updateTableCols()
      }
    },
    store_annoMapping: {
      handler: function(val, oldVal) {
        if (!val.headers.mf) return
        this.n_annotations = val.n_annotations
        this.n_anno_mf = val.headers.mf.length
        this.n_anno_bp = val.headers.bp.length
      }
    },
    //Auto scroll the table to the center node set by the tree (Auto scrolling)
    store_getCenterNode: {
      handler: function(val, oldVal) {
        if (val == null) return
        //Timeout required so that 'storeTableData' is updated after matched nodes are processed
        setTimeout(() => {
          this.findRowandScroll(val)
        }, 1000)
      },
      deep: true,
      immediate: true
    },
    store_getTableHiddenCols: {
      handler: function(val, oldVal) {
        if (val == null) return
        this.defaultColsToHide = val
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.resetTable()
    this.initTable()
    this.process_mapping();
    this.$nextTick(function() {})
  },
  beforeDestroy() {
    this.resetTable()
  },
  updated: function() {
    this.$nextTick(function() {
      // Code that will run only after the
      // entire view has been re-rendered
      if (this.tableRendering == false) {
        this.isLoading = false
      }
    })
  },
  methods: {
    ...mapActions({
      store_setTableIsLoading: types.TABLE_ACTION_SET_TABLE_ISLOADING,
      store_setTableData: types.TABLE_ACTION_SET_DATA,
      store_setClearData: types.TREE_ACTION_CLEAR_DATA,
      store_setSearchTxtWthn: types.TREE_ACTION_SET_SEARCHTEXTWTN,
      store_setTableHiddenCols: types.TABLE_ACTION_SET_TABLE_HIDDENCOLS
    }),
    getMappingFromCsv(fileName) {
      return new Promise((resolve, reject) => {
        d3.csv(fileName, function(error, data) {
          if (error) {
            reject(error)
          } else {
            resolve(data)
          }
        })
      })
    },
    async process_mapping() {
      const mappingCsvData = await this.getMappingFromCsv(
          '/organism_to_display.csv'
      )
      this.mappingData = mappingCsvData;
    },
    resetTable() {
      this.store_setClearData()
      this.isLoading = false
      this.showMsaLegend = false
      this.msaTab = false
      this.editedOnce = false
      this.rowsToRender = []
      this.colsToRender = []
      this.origColsToRender = []
      if (this.$refs.treeLayout) {
        this.$refs.treeLayout.refreshView()
      }
    },
    initTable() {
      this.addCustomScrollEvent()
    },
    updateTableCols() {
      if (!this.colsFromProp || !this.store_tableData) return
      //Only display cols which have corresponding rows in store tableData
      var filteredCols = d3.keys(this.store_tableData[0])
      filteredCols = filteredCols.filter((t) => this.colsFromProp.includes(t))
      filteredCols = filteredCols.map(function(f) {
        return { label: f }
      })
      //Add all annotation cols to 'filteredCols' array if it is present in 'colsFromProp'
      if (this.colsFromProp.includes('Annotations')) {
        if (this.store_annoMapping.headers.mf) {
          this.store_annoMapping.headers.mf.forEach((h, i) => {
            let headerObj = { label: h }
            if (i == this.store_annoMapping.headers.mf.length - 1) {
              headerObj.type = 'first_mf'
            }
            filteredCols.splice(2, 0, headerObj)
          })
          this.store_annoMapping.headers.bp.forEach((h, i) => {
            let headerObj = { label: h }
            if (i == this.store_annoMapping.headers.bp.length - 1) {
              headerObj.type = 'first_bp'
            }
            filteredCols.splice(
              2 + this.store_annoMapping.headers.mf.length,
              0,
              headerObj
            )
          })
        }
      }
      // console.log(this.colsFromProp);
      this.origColsToRender = filteredCols
      //Check for unchecked cols
      if (this.defaultColsToHide.includes('Molecular function')) {
        //Removes all annotations cols
        filteredCols = filteredCols.filter((t) =>
          this.colsFromProp.includes(t.label)
        )
      }
      //Remove default hidden cols from the filtered list
      filteredCols = filteredCols.filter(
        (t) => !this.defaultColsToHide.includes(t.label)
      )
      this.colsHidden = this.defaultColsToHide.length
      this.colsToRender = filteredCols
      this.rowsToRender = []
    },
    toggleTabs() {
      this.msaTab = !this.msaTab
      if (this.msaTab) {
        this.showDPEOption = false
      } else {
        this.showDPEOption = true
      }
      this.$emit('toggle-cols')
      // this.updateRenderRows();
      this.updateTable()
    },
    toggleLegend() {
      this.showMsaLegend = !this.showMsaLegend
    },
    //Triggered on browse resize (window resized using mouse) or when page is zoomed in or out
    handleResize() {
      this.window.width = window.innerWidth
      this.window.height = window.innerHeight
      this.MAX_ROW_HEIGHT = this.ORIG_ROW_HEIGHT
      //Pixel ratio maps the zoom in. At 100% it is 2.0, at 90% it is 1.8 etc.
      let pixelRatio = parseFloat(window.devicePixelRatio.toFixed(2))
      //Hard code adjustment to pixel ratio because the alignment is not perfect
      if (pixelRatio == 1.8) {
        pixelRatio -= 0.2
      } else if (pixelRatio == 1.6) {
        pixelRatio -= 0.325
      } else if (pixelRatio < 2) {
        pixelRatio = 2
      }
      this.MAX_ROW_HEIGHT = this.MAX_ROW_HEIGHT + pixelRatio
      //Update the tree layout (svg height and single row height) on browser resize so that alignment betn tree and table is same
      this.updateTreeLayout()
    },
    //~~~~~~~~~~~~~~~~~~~~~~~~~ TREE ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    setTableRow(n, index) {
      var tableNode = {}
      tableNode['id'] = index
      var geneId = n.data.gene_id
      if (geneId) {
        geneId = geneId.split(':')[1]
      }
      tableNode['Gene'] = n.data.gene_symbol ? n.data.gene_symbol : geneId
      tableNode['Organism'] = n.data.organism
      tableNode['Gene name'] = n.data.gene_symbol
      tableNode['Gene ID'] = geneId
      tableNode['Protein name'] = n.data.definition
      tableNode['Uniprot ID'] = n.data.uniprotId
      tableNode['Subfamily Name'] = n.data.sf_name
      tableNode['MSA'] = n.data.sequence
      if (n.data.accession) tableNode['accession'] = n.data.accession
      //Annotations
      if (n.data.uniprotId) {
        let uniprotId = n.data.uniprotId.toLowerCase()
        if (!this.store_annoMapping.annoMap) {
          return tableNode
        }
        if (this.store_annoMapping.annoMap[uniprotId]) {
          let currAnno = this.store_annoMapping.annoMap[uniprotId]
          let allAnnos = this.store_annoMapping.headers.mf
          allAnnos = allAnnos.concat(this.store_annoMapping.headers.bp)

          allAnnos.forEach((a) => {
            currAnno.forEach((c) => {
              if (c.goName === a) {
                if (c.evidenceCode.includes('IBA')) {
                  if (tableNode[a] != '*') {
                    tableNode[a] = '%'
                  }
                } else {
                  tableNode[a] = '*'
                }
              }
            })
          })
        }
      }
      return tableNode
    },
    onClickNode(node) {
      // console.log("node ", node);
      this.selectedNodeForOrtho = node.data;
      this.showPopup_treeNode = true;
      this.downloading_ortho = 'waiting'
    },
    map_organism_name(organism_id) {
      let organism_name = organism_id
      var found_mapping = this.mappingData.find(
        (o) => o['Abbrev name code'].toLowerCase() === organism_id.toLowerCase()
      )
      if (found_mapping) {
        organism_name = found_mapping.Organism.trim();
      }
      return organism_name;
    },
    downloadOrtholog() {
      let api = this.ORTHO_MAPPING_PANTHER_API
      this.downloading_ortho = 'downloading';
      if(this.selectedNodeForOrtho == null) {
        console.log("No selected node found");
        return;
      }
      axios({
        method: 'POST',
        url: api,
        data: {
          uniprotId: this.selectedNodeForOrtho.uniprotId,
          queryOrganismId: this.selectedNodeForOrtho.taxonId
        },
        timeout: 200000
      })
        .then((res) => {
          let orthoNodes = res.data;
          this.orthoTable.tableCsvData = [];
          orthoNodes.forEach(n => {
            var tableNode = {}
            tableNode['Uniprot ID'] = n.uniprot_id;
            tableNode['Gene ID'] = n.gene_id;
            tableNode['Ortholog type'] = n.ortholog;
            // let organism = this.map_organism_name(n.organism)
            tableNode['Organism'] = n.organism;
            this.orthoTable.tableCsvData.push(tableNode);
          });
          this.orthoTable.tableCsvData.forEach((node) => {
            node[
              "Source: PANTHERDB. Version: 15. Ortholog type 'O' stands for Ortholog, 'LDO' for Least Diverged Ortholog."
            ] = null
          })
          this.orthoTable.tableCsvFields.push(
            "Source: PANTHERDB. Version: 15. Ortholog type 'O' stands for Ortholog, 'LDO' for Least Diverged Ortholog."
          )
          this.downloading_ortho = 'downloaded';
        })
        .catch((err) => {
          console.error('error ', err)
          this.isLoading = false
        })
    },
    onTreeInit(nodes) {
      let tabularData = this.setStoreTableData(nodes)
      //For metadata
      let uniqueOrganisms = []
      let n_organisms = 0
      nodes.forEach((n) => {
        if (!n.children) {
          if (n.data.organism) {
            let org = uniqueOrganisms.find((o) => o.name === n.data.organism)
            n_organisms++
            if (org) {
              org.count++
            } else {
              let org = {
                name: n.data.organism,
                commonName: n.data.displayName,
                taxonId: n.data.taxonId,
                count: 1
              }
              uniqueOrganisms.push(org)
            }
          }
        }
      })

      let msg = {
        tabularData: tabularData,
        uniqueOrganisms: uniqueOrganisms,
        n_organisms: n_organisms
      }
      this.$emit('tree-init', msg)
      this.updateTableCols()

      this.lazyLoad = true

      if (this.store_getSearchTxtWthn != null) {
        this.defaultSearchText = this.store_getSearchTxtWthn
        setTimeout(() => {
          this.$emit('search-tree', this.store_getSearchTxtWthn)
        }, 2000)
      } else {
        this.defaultSearchText = null
        this.store_setSearchTxtWthn(null)
      }
    },
    onTreeUpdate(nodes) {
      // console.log("onTreeUpdate");
      this.tableRendering = true
      //Table data must changed on every tree update.
      //Note: This even changes after the first tree init call.
      this.setStoreTableData(nodes)
      this.isLoading = true
      setTimeout(() => {
        this.updateTable()
      }, 1000)
    },
    updateTable() {
      this.rowsToRender = []
      let maxRows = 30
      let noOfRowsToAdd = maxRows + (this.rowsScrolled + 5)
      if (this.msaTab) {
        this.store_tableData.forEach((n) => {
          let processedRowData = this.processRow(n)
          this.rowsToRender.push(processedRowData)
        })
        this.treeRowSpan = this.rowsToRender.length + 1
        this.rowsHeight = this.rowsToRender.length * this.MAX_ROW_HEIGHT
        this.rowsHeight = this.rowsHeight.toFixed(2)
        this.tableRendering = false
      } else {
        let i = 0
        let noOfTopRowsToRemove = 0
        if (this.rowsScrolled > 200) {
          noOfTopRowsToRemove = this.rowsScrolled - 100
        }
        this.store_tableData.some((n) => {
          if (i < noOfTopRowsToRemove) {
            n.rendering = false
          } else {
            n.rendering = true
          }
          let processedRowData = this.processRow(n)
          this.rowsToRender.push(processedRowData)
          i++
          return i > noOfRowsToAdd
        })
        //Adjust tree column span and height, to fill the whole table and match the original table height
        this.treeRowSpan = this.rowsToRender.length + 1
        this.rowsHeight = this.rowsToRender.length * this.MAX_ROW_HEIGHT
        this.rowsHeight = this.rowsHeight.toFixed(2)
        this.tableRendering = false
      }
    },
    updateTreeLayout() {
      this.rowsHeight = this.rowsToRender.length * this.MAX_ROW_HEIGHT
      this.updateRenderRows()
    },
    //Called from external parent component
    updateRenderRows() {
      // this.isLoading = true;
      this.rowsToRender = []
      if (this.store_tableData) {
        this.store_tableData.forEach((n) => {
          let processedRowData = this.processRow(n)
          this.rowsToRender.push(processedRowData)
        })
      }
    },
    setStoreTableData(nodes) {
      var tabularData = []
      let i = 0
      nodes.forEach((n) => {
        if (!n.children) {
          let row = this.setTableRow(n, i++)
          tabularData.push(row)
        }
      })
      this.store_setTableData(tabularData)
      return tabularData
    },
    //if lazyLoad=true, only add 'noOfRowsToAdd' to the table, instead of all rows.
    //This depends on 'rowsScrolled'
    updateRows(calledWhileScrolling = false, pm = '') {
      // console.log("called by "+ pm);
      if (!this.lazyLoad) return
      //rowsScrolled is the number of rows scrolled by mouse or through panning of tree.
      //We add all the rows scolled to the table
      let maxRows = 30
      let noOfRowsToAdd = maxRows + this.rowsScrolled
      let noOfTopRowsToRemove = 0
      if (this.rowsScrolled > 200) {
        noOfTopRowsToRemove = this.rowsScrolled - 100
      }
      let i = 0
      this.rowsToRender = []
      //this.rowsToRender - add rows ranging from index 0 to [noOfRowsToAdd].
      // set 'rendering' to false, for all rows less than 'noOfTopRowsToRemove'. Since this
      // rows will be out of view and scrolled up, we don't render the content, for performance reasons.

      this.store_tableData.some((n) => {
        if (i < noOfTopRowsToRemove) {
          n.rendering = false
        } else {
          n.rendering = true
        }
        let processedRowData = this.processRow(n)
        this.rowsToRender.push(processedRowData)
        i++
        return i > noOfRowsToAdd
      })
    },
    //rowData: [colName]:[colValue]
    //returns cellContent: [text: "?", type: <cell-type>,
    // optional additional features for each cell type]
    processRow(rowData) {
      let row = {}
      //If 'rendering' is false, row is rendered as default with blank text for performance reasons
      if (rowData.rendering == false) {
        return { text: '' }
      }
      this.colsToRender.forEach((c) => {
        let cellTxt = rowData[c.label]
        let content = { text: cellTxt, id: rowData.id }
        if (cellTxt == '*') {
          content.type = 'annotation'
          content.symbol = 'flask'
        } else if (cellTxt == '%') {
          content.type = 'annotation'
          content.symbol = 'tree'
        }
        if (c.label == 'MSA') {
          content.text = cellTxt
          content.type = 'msa'
          content.isHighlight = true
        } else if (c.label == 'Uniprot ID') {
          content.type = 'link'
          content.link = 'https://www.uniprot.org/uniprot/' + cellTxt
        }
        row[c.label] = content
      })

      let cellTxt = rowData['Uniprot ID']
      //"UniprotFixed" is added to rowData to be used for getting annotation for row clicked,
      // but this is not displayed in the table as a column.
      let content = { text: cellTxt, id: rowData.id }
      row['UniprotFixed'] = content
      return row
    },
    //TREE MENU
    showLegend() {
      this.$refs.treeLayout.onShowLegend()
      this.legendIcon = !this.legendIcon
    },
    onDefaultView() {
      this.$refs.treeLayout.onDefaultView()
      // this.$refs.tlmenu.onReset();
    },
    expandAll() {
      this.$refs.treeLayout.onExpandAll()
    },
    onSearchWithinTree(text) {
      this.store_setSearchTxtWthn(text)
      this.$emit('search-tree', text)
    },
    onPruneLoading(isLoad) {
      this.$refs.treeLayout.onPruneLoading(isLoad)
    },
    ///~~~~~~~~~~~~~~~~~~~~~~~~~~ Dropdown Menu Click Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    ddClicked(id) {
      if (id == -1) {
        this.dropdownMenuClicked()
      } else {
        switch (id) {
          case 0:
            this.exportXML()
            break
          case 1:
            break
          case 2:
            this.highlightTree()
            break
          case 3:
            this.pruneTreeFromMenu()
            break
          case 4:
            this.exportPNG()
            break
          case 5:
            this.exportSVG()
            break
          default:
            console.log('Error! Unknown Dropdown ID')
        }
      }
    },
    //If dropdown btn is clicked in the tree menu, set table head css to "overflow: visible"
    // This is immediately turned hidden when we scroll inside the "handlescroll" function
    // This displays the dropdown menu correctly on top of the table
    dropdownMenuClicked() {
      if (document.getElementById('head')) {
        document.getElementById('head').style.overflowX = 'visible'
      }
    },
    exportXML() {
      this.$emit('export-xml')
    },
    exportPNG() {
      this.$refs.treeLayout.onExportPng(this.treeId)
    },
    exportSVG() {
      this.$refs.treeLayout.onExportSvg(this.treeId)
    },
    pruneTreeFromMenu() {
      this.$emit('prune-from-menu')
    },
    highlightTree() {
      this.$emit('highlight-tree')
    },
    // ~~~~~~~~~~~~~~~~~~~~~~~~ Table Panel Edit ~~~~~~~~~~~~~~~~//
    //Show Table Edit Panel (Popup to add/remove and reorder table columns)
    showPanel() {
      this.showDPEPopup = true
      this.setEditColsList()
    },
    //Events from table edit panel
    onAnyDPECheckboxChange() {
      setTimeout(() => {
        this.refreshTablePanel()
      })
    },
    onMoveUp(col) {
      if (col.annotation) {
        let kf_idx = this.editColsList.findIndex(
          (c) => c.label == 'Molecular function'
        )
        let kf = this.editColsList[kf_idx]
        let idx = kf.children.findIndex((c) => c.id == col.id)
        if (idx == -1) {
          kf_idx = this.editColsList.findIndex(
            (c) => c.label == 'Biological process'
          )
          kf = this.editColsList[kf_idx]
          idx = kf.children.findIndex((c) => c.id == col.id)
        }
        if (kf.children[idx + 1] == null || idx == -1) return
        let origCol = {}
        //Object.assign needed for Vue reactivity, as any change on Vue list's children, need to be assgined this way.
        //Read more: https://vuejs.org/v2/guide/reactivity.html#For-Objects
        Object.assign(origCol, kf.children[idx])
        Object.assign(kf.children[idx], kf.children[idx - 1])
        Object.assign(kf.children[idx - 1], origCol)
        Object.assign(this.editColsList[kf_idx], kf)
      } else {
        let origCol = {}
        Object.assign(origCol, col)
        let idx = this.editColsList.findIndex((c) => c.id == col.id)
        if (idx == 1) {
          return
        }
        if (this.editColsList[idx - 1]) {
          Object.assign(this.editColsList[idx], this.editColsList[idx - 1])
          Object.assign(this.editColsList[idx - 1], origCol)
        }
      }
      setTimeout(() => {
        this.refreshTablePanel()
      })
    },
    onMoveDown(col) {
      if (col.annotation) {
        let kf_idx = this.editColsList.findIndex(
          (c) => c.label == 'Molecular function'
        )
        let kf = this.editColsList[kf_idx]
        let idx = kf.children.findIndex((c) => c.id == col.id)
        if (idx == -1) {
          kf_idx = this.editColsList.findIndex(
            (c) => c.label == 'Biological process'
          )
          kf = this.editColsList[kf_idx]
          idx = kf.children.findIndex((c) => c.id == col.id)
        }
        if (kf.children[idx + 1] == null || idx == -1) return
        let origCol = {}
        Object.assign(origCol, kf.children[idx])
        Object.assign(kf.children[idx], kf.children[idx + 1])
        Object.assign(kf.children[idx + 1], origCol)
        Object.assign(this.editColsList[kf_idx], kf)
      } else {
        let origCol = {}
        if (col.id == 0) return
        Object.assign(origCol, col)
        let idx = this.editColsList.findIndex((c) => c.id == col.id)
        if (this.editColsList[idx + 1]) {
          Object.assign(this.editColsList[idx], this.editColsList[idx + 1])
          Object.assign(this.editColsList[idx + 1], origCol)
        }
      }
      setTimeout(() => {
        this.refreshTablePanel()
      })
    },
    onDPEUncheckAll(colSelected) {
      let cols = this.editColsList
      let findIdx = cols.findIndex((c) => c.label == colSelected.label)
      // console.log(findIdx);
      let colAnnotations = cols[findIdx]
      if (colAnnotations.children) {
        colAnnotations.children.forEach((c) => {
          if (c.selected == true) {
            c.selected = false
          }
        })
      }
      this.editColsList[findIdx] = colAnnotations
    },
    onDPECheckAll(colSelected) {
      let cols = this.editColsList
      let findIdx = cols.findIndex((c) => c.label == colSelected.label)
      let colAnnotations = cols[findIdx]
      if (colAnnotations.children) {
        colAnnotations.children.forEach((c) => {
          if (c.selected == false) {
            c.selected = true
          }
        })
      }
      this.editColsList[findIdx] = colAnnotations
    },
    setEditColsList() {
      if (this.editedOnce) {
        return
      }
      let colsToEdit = []
      let i = 0
      let total_annotations = this.store_annoMapping.n_annotations
      this.origColsToRender.forEach((colObj) => {
        let col = { id: i, label: colObj.label, selected: true, children: [] }
        if (i == 0) {
          col.disabled = true
        }
        if (this.defaultColsToHide.includes(colObj.label)) {
          col.selected = false
        }
        if (i == 2) {
          let parentCol = {
            id: i,
            label: 'Molecular function',
            selected: true,
            checkAllChildren: true
          }
          parentCol.children = []
          if (this.defaultColsToHide.includes('Molecular function')) {
            parentCol.selected = false
          }
          colsToEdit.push(parentCol)
          col['annotation'] = true
          if (this.defaultColsToHide.includes('Molecular function')) {
            col.selected = false
          }
          colsToEdit[2].children.push(col)
        } else if (i > 2 && i < 2 + this.n_anno_mf) {
          col['annotation'] = true
          if (this.defaultColsToHide.includes('Molecular function')) {
            col.selected = false
          }
          colsToEdit[2].children.push(col)
        } else if (i == 2 + this.n_anno_mf) {
          let parentCol = {
            id: i,
            label: 'Biological process',
            selected: true,
            checkAllChildren: true
          }
          parentCol.children = []
          if (this.defaultColsToHide.includes('Biological process')) {
            parentCol.selected = false
          }
          colsToEdit.push(parentCol)
          col['annotation'] = true
          if (this.defaultColsToHide.includes('Biological process')) {
            col.selected = false
          }
          colsToEdit[colsToEdit.length - 1].children.push(col)
        } else if (
          i > 2 + this.n_anno_mf &&
          i < 2 + this.n_anno_mf + this.n_anno_bp
        ) {
          col['annotation'] = true
          if (this.defaultColsToHide.includes('Biological process')) {
            col.selected = false
          }
          colsToEdit[colsToEdit.length - 1].children.push(col)
        } else {
          colsToEdit.push(col)
        }
        i++
      })
      this.editColsList = colsToEdit
    },
    onTableEdit() {
      this.refreshTablePanel()
      this.showDPEPopup = false
    },
    //~~~~~~~~~~~~~~~~~~~~~~~~~~ Table Utils ~~~~~~~~~~~~~~~~~~~~//
    //Refresh the table rendering according to the "editColsList" which has information for cols
    // selected/deselected and the order of the cols to be displayed.
    refreshTablePanel() {
      let filteredCols = []
      let hiddenCols = []
      for (let i = 0; i < this.editColsList.length; i++) {
        let colObj = this.editColsList[i]
        if (
          colObj.label == 'Molecular function' ||
          colObj.label == 'Biological process'
        ) {
          if (colObj.children) {
            if (colObj.label == 'Molecular function') {
              this.n_anno_mf = 0
            }
            if (colObj.label == 'Biological process') {
              this.n_anno_bp = 0
            }
            colObj.children.forEach((c) => {
              if (c.selected == true) {
                if (colObj.label == 'Molecular function') {
                  if (this.n_anno_mf == 0) {
                    c.type = 'first_mf'
                  } else {
                    c.type = ''
                  }
                  this.n_anno_mf++
                }
                if (colObj.label == 'Biological process') {
                  if (this.n_anno_bp == 0) {
                    c.type = 'first_bp'
                  } else {
                    c.type = ''
                  }
                  this.n_anno_bp++
                }
                filteredCols.push(c)
              }
            })
          }
        } else if (colObj.selected == true) {
          filteredCols.push(colObj)
        }
        if (colObj.selected == false) {
          hiddenCols.push(colObj.label)
        }
      }
      this.colsToRender = []

      filteredCols.forEach((f) => {
        this.colsToRender.push(f)
      })
      //set prefix_anno
      this.prefix_anno = 0
      for (var i = 0; i < filteredCols.length; i++) {
        if (filteredCols[i].annotation) {
          break
        }
        this.prefix_anno++
      }
      this.colsHidden = hiddenCols.length
      //Hidden cols vuex storage reused for other trees as well in a session
      this.store_setTableHiddenCols(hiddenCols)
      setTimeout(() => {
        this.updateTable()
      }, 100)
      this.editedOnce = true
    },
    getTableCsvData(nodes) {
      this.$emit('set-csv-data', nodes)
    },
    //Checks if the column is the first annotation column
    isFirstAnnoCol(colName) {
      let mf_len = this.store_annoMapping.headers.mf.length
      if (
        mf_len > 0 &&
        colName == this.store_annoMapping.headers.mf[mf_len - 1]
      )
        return true
      let bp_len = this.store_annoMapping.headers.bp.length
      if (
        bp_len > 0 &&
        colName == this.store_annoMapping.headers.bp[bp_len - 1]
      )
        return true
      return false
    },
    //SCROLL
    addCustomScrollEvent() {
      //On props change, the $refs reloads, so need to add scroll event at the next frame,
      // hance the timeout.
      setTimeout(() => {
        if (this.$refs.tbody) {
          //handleScroll is called with a throttle of 10 ms, this is to control the number of
          // calls made to the function, on scrolling of mouse.
          this.$refs.tbody.addEventListener(
            'scroll',
            _.throttle(this.handleScroll, 10)
          )
        }
      })
    },
    //This is called by the html table's scrolling function (mouse scroll on table)
    handleScroll() {
      if (document.getElementById('head')) {
        document.getElementById('head').style.overflowX = 'hidden'
      }
      let scrollLeft_curr = document.getElementById('body').scrollLeft
      this.scrollTableHeader(scrollLeft_curr)
      let scrollTop_curr = document.getElementById('body').scrollTop
      let rowsScrolledCurr = Math.round(scrollTop_curr / this.MAX_ROW_HEIGHT)
      if (Math.abs(rowsScrolledCurr - this.rowsScrolled) > 5) {
        this.rowsScrolled = rowsScrolledCurr
        if (!this.msaTab) {
          this.updateTable()
        }
      }
    },
    scrollTableHeader(amount) {
      let thead = document.getElementById('head')
      thead.scrollLeft = amount
    },
    //From tree panning
    setScrollToRow(rowNumber) {
      this.rowsScrolled = rowNumber - 8
      const tbody = document.getElementById('body')
      if (tbody) {
        if (this.rowsScrolled > 0) {
          this.updateTable()
          setTimeout(() => {
            tbody.scrollTop = this.MAX_ROW_HEIGHT * this.rowsScrolled
          }, 1000)
        } else {
          this.rowsScrolled = 0
          this.updateTable()
          setTimeout(() => {
            tbody.scrollTop = 0
          }, 1000)
        }
      }
    },
    //Find Row in the table based on 'val' and scroll the table to that row
    findRowandScroll(val) {
      var foundRow = this.store_tableData.find(
        (d) => d['Gene ID'] === val.geneId
      )
      if (!foundRow) {
        let accession = val.data.accession
        foundRow = this.store_tableData.find(
          (d) => d['accession'] === accession
        )
      }
      if (foundRow) {
        this.setScrollToRow(foundRow.id)
      } else {
        console.log('row not found for ', foundRow)
      }
    },
    //CLICK Cell
    tdClicked(c, row) {
      if (row[c] && row[c].text != '*' && row[c].text != '%') return
      this.$emit('anno-click', { row: row, val: c })
    },
    //Display Popup
    displayPopup(header, data) {
      this.popupHeader = header
      this.popupData = this.getPopupData(data)
      this.showPopup = true
    },
    getPopupData(annoList) {
      let popUpTableData = []
      annoList.forEach((ann) => {
        // console.log(ann);
        let singleRow = []
        let goTerm = { type: 'link', text: ann.goTerm, link: ann.goTermLink }
        singleRow.push(goTerm)

        let code = ann.code
        singleRow.push(code)

        let references = { type: 'links' }
        references['links'] = []
        if(ann.reference) {
        ann.reference.forEach((ref) => {
          references['links'].push({ text: ref.count, link: ref.link })
        })
        }
        singleRow.push(references)

        let source = { type: 'link', text: ann.source, link: ann.sourceLink }
        singleRow.push(source)

        popUpTableData.push(singleRow)
      })
      return popUpTableData
    },
    getHeader(colObj, i) {
      let title = colObj.label
      let header = { text: title }
      if (this.headerMap[title]) {
        header['text'] = this.headerMap[title]
      }
      let baseCols = [
        'Gene',
        'Organism',
        'Gene name',
        'Gene ID',
        'Protein name',
        'Uniprot ID',
        'Subfamily Name',
        'MSA'
      ]
      if (!baseCols.includes(title)) {
        header['type'] = 'slanted'
      }
      return header
    },
    getThClasses(colObj, col_idx) {
      let classes = []
      if (colObj == 'tree') {
        //Sets min width for tree header
        classes.push('widthTree')
        //Sets the column to be sticky while scrolling left/right
        classes.push('stickyCol1')
        return classes
      } else {
        if (col_idx == 0) {
          classes.push('stickyCol2')
        }
      }
      //Set the borders for annotations if present
      if (this.n_annotations > 0) {
        if (col_idx >= this.prefix_anno && col_idx <= this.n_anno_mf) {
          classes.push('cell-no-border')
        }
        if (
          col_idx > this.n_anno_mf + 1 &&
          col_idx <= this.n_anno_bp + this.n_anno_mf
        ) {
          classes.push('cell-no-border')
        }
      }
      if (this.colsFromProp.includes(colObj.label)) {
        if (colObj.label == 'MSA') {
          classes.push('widthMax')
        } else {
          classes.push('widthDefault')
          // classes.push("left-border");
        }
      } else {
        classes.push('widthMin')
      }
      return classes
    },
    getTdClasses(colName, cellValue, col_idx) {
      let classes = []
      if (colName == 'tree') {
        //Sets min width for tree header
        classes.push('widthTree')
        classes.push('stickyCol1')
      }
      //Set default width for cols which are not annotations or 'msa'
      else if (this.colsFromProp.includes(colName)) {
        if (colName == 'MSA') {
          classes.push('widthMax')
        } else {
          classes.push('widthDefault')
        }
      } else {
        classes.push('widthMin')
        classes.push('cell-no-border')
      }
      //col_idx = 0 is 'Gene', which is the 2nd column in table which needs to be sticky
      if (col_idx == 0) {
        classes.push('stickyCol2')
      }
      if (colName == 'Gene ID' && this.n_annotations > 0) {
        classes.push('left-border')
      }
      if (cellValue && (cellValue.text == '*' || cellValue.text == '%')) {
        classes.push('tdHover')
      }
      return classes
    },
    showPopover(colName) {
      if (colName === 'Gene name') return true
      if (colName === 'Gene ID') return true
      if (colName === 'Protein name') return true
      if (colName === 'Subfamily Name') return true
      else return false
    },
    getPopoverText(colName) {
      if (colName === 'Gene name') return this.popover2Text
      if (colName === 'Gene ID') return this.popover3Text
      if (colName === 'Protein name') return this.popover4Text
      if (colName === 'Subfamily Name') return this.popover5Text
      return ''
    }
  }
}
</script>
<style scoped>
#parent {
  /* width: 1600px;
        height: 1200px; */
  overflow: hidden;
  padding-bottom: 20px;
}
.mainTable {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 98%;
  height: 95%;
  overflow: hidden;
  font-size: 14px;
  font-family: sans-serif;
  border-collapse: separate;
  /* border-spacing: 0px 0px; */
}
.mainTable thead {
  flex: 0 0 auto;
  display: block;
  overflow-x: hidden;
  overflow-y: visible;
  background-color: #9cd5e3;
  /* Set thead z-index > tbody z-index, so the header dropdown menu appears on top */
  z-index: 12;
  border-top: 3px solid #f1f1f0;
  /* border-right: 3px solid #f1f1f0; */
}
.mainTable tbody {
  overflow: scroll;
  z-index: 11;
  border-right: 3px solid #f1f1f0;
  /* border-spacing: 0; */
}
#mainTr {
  border-top: 3px solid #f1f1f0;
  border-bottom: 3px solid #f1f1f0;
  filter: brightness(100%) !important;
  cursor: default !important;
  background-color: #9cd5e3;
}
/* Default th*/
.mainTable th {
  text-align: center;
  border-right: 3px solid #f1f1f0;
}
.mainTable td {
  height: 35px !important;
  max-height: 35px !important;
  min-height: 35px !important;
  line-height: 21px;
  border-right: 3px solid #f1f1f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis !important;
}
/* Override special ths, tds */
th.widthTree,
td.widthTree {
  min-width: 700px;
}
th.widthTree {
  padding-top: 15px;
  vertical-align: bottom;
  padding-bottom: 15px;
}
th.widthDefault,
td.widthDefault {
  position: relative;
  min-width: 200px;
  width: 200px;
  max-width: 200px;
}
th.widthDefault {
  vertical-align: bottom;
  padding-bottom: 10px;
}
th.widthMin,
td.widthMin {
  position: relative;
  min-width: 50px;
  width: 50px;
  max-width: 50px;
  z-index: 4;
}
th.widthMax,
td.widthMax {
  text-align: left !important;
  font-size: 14px !important;
  white-space: nowrap;
  max-width: 100%;
  font-family: monospace;
  letter-spacing: 0.1px;
}
td.widthMax {
  background-color: #e9e9e9 !important;
}
/* bg is required for sticky td and th so that they hide the other elements behind */
th.stickyCol1,
td.stickyCol1 {
  background-color: #9cd5e3;
  position: sticky;
  left: 0;
  z-index: 11;
}
th.stickyCol2,
td.stickyCol2 {
  background-color: #9cd5e3;
  position: sticky;
  left: 700px;
  z-index: 11;
  border-bottom: 0;
  border-top: 0;
  border-right: 3px solid #f1f1f0 !important;
}
/* Even odd row colors */
.mainTable tr:nth-child(even),
tr:nth-child(even) td.stickyCol2 {
  background-color: #cdeaf5;
}
.mainTable tr:nth-child(odd),
td.stickyCol2 {
  background-color: #e9e9e9;
}
th.cell-no-border {
  border-bottom: 0;
  border-left: 0;
  border-right: 0;
}
td.cell-no-border {
  border-right: 0px solid #f1f1f0 !important;
  border-left: 0px solid #f1f1f0 !important;
}
th.left-border,
td.left-border {
  border-left: 3px solid #f1f1f0 !important;
}
td.tdHover:hover {
  background-color: #e1e7f3 !important;
  filter: brightness(85%);
  cursor: pointer;
}

/* Fixed posn buttons */
.showMsaBtn {
  position: absolute;
  left: 60px;
  top: -3px;
  z-index: 100;
  outline: 0 !important;
  outline-offset: 0 !important;
  background-image: none !important;
  -webkit-box-shadow: none !important;
  box-shadow: none !important;
  font-size: 0.9rem;
}
.showHiddenVal {
  position: absolute;
  left: 60px;
  top: 20px;
  z-index: 100;
  outline: 0 !important;
  outline-offset: 0 !important;
  background-image: none !important;
  -webkit-box-shadow: none !important;
  box-shadow: none !important;
  font-size: 0.9rem;
}
.showCogBtn {
  position: absolute;
  left: 25px;
  top: 20px;
  border: none;
  outline: 0 !important;
  font-size: 20px;
  text-align: center;
  line-height: 100%;
  /* background-image: none  !important; */
  -webkit-box-shadow: none !important;
  box-shadow: none !important;
}
.msalegendbtn {
  position: absolute;
  right: 10px;
  top: 130px;
  z-index: 100;
}
.legend-box {
  background-color: #9e9e9e;
  position: absolute;
  top: 160px;
  right: 0px;
}
.annoPopver {
  position: absolute;
  left: -10px;
  z-index: 10;
  -webkit-transform: translate(3px, 3px);
}
.anno_type {
  font-size: 20px;
  font-weight: bold;
}
.aspectInfo {
  cursor: pointer;
}

::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 15px;
}
::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgb(0, 0, 0, 0.5);
  -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.897);
  width: 70px;
}
</style>
