//Getters
export const TREE_GET_JSON = 'tree/store_treeJsonString';
export const TABLE_GET_DATA = 'treedata/store_tableData';
export const TREE_GET_ANNOTATIONS = 'treedata/stateTreeAnnotations';
export const TREE_GET_MSADATA = 'treedata/store_treeMsaData';
export const TREE_GET_MAXMSAL = 'treedata/store_maxMsaLength';
export const TREE_GET_METADATA = 'treedata/store_getTreeMetadata';
export const TREE_GET_ANNO_MAPPING = 'treedata/store_annoMapping';
export const TREE_GET_NODES = 'treedata/stateTreeNodes';
export const TREE_GET_MATCHED_NODES = 'treedata/stateTreeMatchedNodes';
export const TREE_GET_CENTER_NODE = 'treedata/store_getCenterNode';
export const TREE_GET_ZOOM = 'treedata/stateTreeZoom';
export const TREE_GET_SEARCHTEXTWTN = 'treedata/store_getSearchTxtWthn';
export const TREE_GET_ISGRAFTED = 'treedata/store_getHasGrafted';
export const TABLE_GET_MSA_FREQ = 'treedata/store_getFreqMsa';
export const TABLE_GET_SCROLL = 'treedata/store_getTableScrollRow';
export const TABLE_GET_ISTABLELOADING = 'treedata/store_tableIsLoading';

//actions
export const TREE_ACTION_SET_PANTHER_TREE = 'treedata/store_setPantherTreeFromApi';
export const TREE_ACTION_SET_PANTHER_TREE2 = 'treedata/store_setPantherTreeFromString';
export const TABLE_ACTION_SET_DATA = 'treedata/store_setTableData';
export const TREE_ACTION_SET_NODES = 'treedata/stateSetTreeNodes';
export const TREE_ACTION_SET_METADATA = 'treedata/store_setTreeMetadata';
export const TREE_ACTION_SET_ANNO_MAPPING = 'treedata/store_setAnnoMapping';
export const TREE_ACTION_SET_MSADATA = 'treedata/store_setMsaFromApi';
export const TREE_ACTION_SET_ANNODATA = 'treedata/store_setAnnoFromApi';
export const TREE_ACTION_SET_MATCHED_NODES = 'treedata/stateSetTreeMatchedNodes';
export const TREE_ACTION_SET_CENTER_NODE = 'treedata/store_setCenterNode';
export const TREE_ACTION_SET_ZOOM = 'treedata/stateSetTreeZoom';
export const TABLE_ACTION_SET_SCROLL = 'treedata/store_setTableScrolledRow';
export const TREE_ACTION_SET_SEARCHTEXTWTN = 'treedata/store_setSearchTxtWthn';
export const TREE_ACTION_SET_ISGRAFTED = 'treedata/store_setHasGrafted';
export const TABLE_ACTION_SET_TABLE_ISLOADING = 'treedata/store_setTableIsLoading';
export const TABLE_ACTION_SET_MSA_FREQ = 'treedata/store_setFreqMsa';
export const TREE_ACTION_GET_ANNOTATIONS = 'tree/getAnnotations';