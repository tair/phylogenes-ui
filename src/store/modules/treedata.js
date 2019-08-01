import * as types from '../types_treedata';
import axios from "axios/index";

// const API_URL = 'http://localhost:3000/api/panther';
const API_URL = 'http://54.68.67.235:3000/api/panther';
// const API_URL = 'http://52.37.99.223:3000/api/panther';

const state = {
    treedata: {
        isLoading: false,
        isTableLoading: false,
        iserror: false,
        data: null,
        jsonString: null,
        go_annotations: null,
        metadata: {
            familyName: [],
            taxonRange: ''
        },
        anno_mapping: {
          headers: [],
          mapping: null
        },
        nodes: null,
        nodeAtCenter: null, //Node which should be set at the center of tree panel view.
        matchedNodes: null,
        zoom: null,
        scroll: null,
        topPaddingY: 0,
        searchTextWithin: null
    }
};

const getters = {
    [types.TREE_GET_DATA]: state => {
        return state.treedata.data;
    },
    [types.TREE_GET_JSON]: state => {
        return state.treedata.jsonString;
    },
    [types.TREE_GET_ANNOTATIONS]: state => {
      return state.treedata.go_annotations;
    },
    [types.TREE_GET_METADATA]: state => {
        return state.treedata.metadata;
    },
    [types.TREE_GET_ANNO_MAPPING]: state => {
      return state.treedata.anno_mapping;
    },
    [types.TREE_GET_NODES]: state => {
        return state.treedata.nodes;
    },
    [types.TREE_GET_MATCHED_NODES]: state => {
        return state.treedata.matchedNodes;
    },
    [types.TREE_GET_CENTER_NODE]: state => {
        return state.treedata.nodeAtCenter;
    },
    [types.TREE_GET_ZOOM]: state => {
        return state.treedata.zoom;
    },
    [types.TREE_GET_SEARCHTEXTWTN]: state => {
        return state.treedata.searchTextWithin;
    },
    [types.TABLE_GET_SCROLL]: state => {
        return state.treedata.scroll;
    },
    [types.TABLE_GET_ISTABLELOADING]: state => {
        return state.treedata.isTableLoading;
    },
};

const actions = {
    [types.TREE_ACTION_SET_DATA]: (context, payload) => {
        context.state.treedata.data = payload;
    },
    [types.TREE_ACTION_SET_NODES]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.nodes = payload;
    },
    [types.TREE_ACTION_SET_MATCHED_NODES]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.matchedNodes = payload;
    },
    [types.TREE_ACTION_SET_METADATA]: (context, payload) => {
        context.state.treedata.metadata = payload;
    },
    [types.TREE_ACTION_SET_ANNO_MAPPING]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.anno_mapping = payload;
    },
    [types.TREE_ACTION_SET_CENTER_NODE]: (context, payload) => {
        context.state.treedata.nodeAtCenter = payload;
    },
    [types.TREE_ACTION_SET_ZOOM]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.zoom = payload;
    },
    [types.TABLE_ACTION_SET_SCROLL]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.scroll = payload;
    },
    [types.TREE_ACTION_SET_SEARCHTEXTWTN]: (context, payload) => {
        context.state.treedata.searchTextWithin = payload;
    },
    [types.TREE_ACTION_GET_JSON]: (context, payload) => {
        if (!payload) return;
        axios({
            method: 'GET',
            url: API_URL + '/tree/' + payload
        })
            .then(res => {
                if(res.data.response.docs.length > 0) {
                    if(res.data.response.docs[0].jsonString) {
                        context.state.treedata.jsonString = res.data.response.docs[0].jsonString;
                    }
                    if(res.data.response.docs[0].family_name) {
                        context.state.treedata.metadata.familyName = res.data.response.docs[0].family_name;
                    }
                    if(res.data.response.docs[0].speciation_events) {
                        context.state.treedata.metadata.taxonRange = res.data.response.docs[0].speciation_events[0];
                    }
                    if(res.data.response.docs[0].go_annotations) {
                        context.state.treedata.go_annotations = res.data.response.docs[0].go_annotations;
                    } else if (!res.data.response.docs[0].go_annotations) {
                        context.state.treedata.go_annotations = null;
                    }
                }
                // tree data
                // context.state.treeData.data.results = res.data.response.docs;
                // context.state2.treeData.data.queryTime = res.data.responseHeader.QTime;
                // context.state2.treeData.data.rows = res.data.responseHeader.params.rows;
                // context.state2.treeData.data.startRow = res.data.response.start;

            })
            .catch(error => {
                console.log('Error while reading data (E8273): ' + JSON.stringify(error));
            })
    },
    [types.TREE_ACTION_GET_ANNOTATIONS]: (context, payload) => {
        axios({
            method: 'GET',
            url: API_URL + '/go_annotations/' + payload
        })
            .then(res => {
                if(res.data.response.docs.length > 0) {
                    context.state.treedata.go_annotations = res.data.response.docs[0].go_annotations;
                }
            })
            .catch(error => {
                console.log('Error while reading data (E8273): ' + JSON.stringify(error));
            })
    },
    [types.TABLE_ACTION_SET_TABLE_ISLOADING]: (context, payload) => {
        context.state.treedata.isTableLoading = payload;
    }
};

export default {
    state,
    getters,
    actions
}