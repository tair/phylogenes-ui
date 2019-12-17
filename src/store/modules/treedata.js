import * as types from '../types_treedata';
import axios from "axios/index";

const API_URL = process.env.VUE_APP_API_URL + '/api/panther';

const state = {
    treedata: {
        isLoading: false,
        isTableLoading: false,
        hasGrafted: false,
        iserror: false,
        data: null,
        jsonString: null,
        jsonObj: null,
        go_annotations: null,
        freq_msa_arr: [],
        msa_data: new Map(),
        max_msa_length: 0,
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
        matchedNodes: {
            allMatchedNodes: null,
            currIdx: 0
        },
        zoom: null,
        scroll: null,
        topPaddingY: 0,
        searchTextWithin: null,
        graftSequence: null
    }
};

const getters = {
    [types.TABLE_GET_DATA]: state => {
        return state.treedata.data;
    },
    [types.TREE_GET_JSON]: state => {
        return state.treedata.jsonString;
    },
    [types.TREE_GET_JSON_OBJ]: state => {
        return state.treedata.jsonObj;
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
    [types.TREE_GET_MSADATA]: state => {
        return state.treedata.msa_data;
    },
    [types.TREE_GET_MAXMSAL]: state => {
        return state.treedata.max_msa_length;
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
    [types.TREE_GET_ISGRAFTED]: state => {
        return state.treedata.hasGrafted;
    },
    [types.TABLE_GET_SCROLL]: state => {
        return state.treedata.scroll;
    },
    [types.TABLE_GET_ISTABLELOADING]: state => {
        return state.treedata.isTableLoading;
    },
    [types.TABLE_GET_MSA_FREQ]: state => {
        return state.treedata.freq_msa_arr;
    },
    [types.TREE_GET_GRAFTSEQ]: state => {
        return state.treedata.graftSequence;
    }
};

const actions = {
    [types.TABLE_ACTION_SET_DATA]: (context, payload) => {
        context.state.treedata.data = payload;
    },
    [types.TREE_ACTION_SET_NODES]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.nodes = payload;
    },
    [types.TREE_ACTION_SET_MATCHED_NODES]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.matchedNodes.allMatchedNodes = payload;
    },
    [types.TREE_ACTION_SET_MATCHED_NODES_CURRIDX]: (context, payload) => {
        // console.log("Action", payload);
        context.state.treedata.matchedNodes.currIdx = payload;
    },
    [types.TREE_ACTION_SET_METADATA]: (context, payload) => {
        context.state.treedata.metadata = payload;
    },
    [types.TREE_ACTION_SET_ANNO_MAPPING]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.anno_mapping = payload;
    },
    [types.TREE_ACTION_SET_MSADATA]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.msa_data = payload;
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
    [types.TREE_ACTION_SET_ISGRAFTED]: (context, payload) => {
        context.state.treedata.hasGrafted = payload;
    },
    [types.TREE_ACTION_SET_GRAFTSEQ]: (context, payload) => {
        context.state.treedata.graftSequence = payload;
    },
    [types.TREE_ACTION_SET_PANTHER_TREE2]: (context, payload) => {
        context.state.treedata.jsonString = payload;
        context.state.treedata.jsonObj = payload;
    },
    [types.TREE_ACTION_SET_PANTHER_TREE]: (context, payload) => {
        if (!payload) return;
        return new Promise((result, rej) => {
            axios({
                method: 'GET',
                url: API_URL + '/tree/' + payload
            })
            .then(res => {
                if (res.data.response.docs.length > 0) {
                    if (res.data.response.docs[0].jsonString) {
                        context.state.treedata.jsonString = res.data.response.docs[0].jsonString;
                    }
                    if (res.data.response.docs[0].family_name) {
                        context.state.treedata.metadata.familyName = res.data.response.docs[0].family_name;
                    }
                    if (res.data.response.docs[0].speciation_events) {
                        context.state.treedata.metadata.taxonRange = res.data.response.docs[0].speciation_events[0];
                    }
                    if (res.data.response.docs[0].go_annotations) {
                        context.state.treedata.go_annotations = res.data.response.docs[0].go_annotations;
                    } else if (!res.data.response.docs[0].go_annotations) {
                        context.state.treedata.go_annotations = null;
                    }
                }
                result("panther tree");
            })
            .catch(error => {
                console.log('Error while reading data (E8273): ' + JSON.stringify(error));
                rej();
            })
        });
    },
    [types.TREE_ACTION_SET_ANNODATA]: (context, payload) => {
        if (!payload) return;
        return new Promise((result, rej) => {
            axios({
                method: 'GET',
                url: API_URL + '/tree/' + payload
            })
            .then(res => {
                console.log(res);
                if (res.data.response.docs.length > 0) {
                    if (res.data.response.docs[0].go_annotations) {
                        context.state.treedata.go_annotations = res.data.response.docs[0].go_annotations;
                    } else if (!res.data.response.docs[0].go_annotations) {
                        context.state.treedata.go_annotations = null;
                    }
                }
                result("panther tree");
            })
            .catch(error => {
                console.log('Error while reading data (E8273): ' + JSON.stringify(error));
                rej();
            })
        });
    },
    [types.TREE_ACTION_SET_MSADATA]: (context, payload) => {
        if (!payload) return;
        return new Promise((result, rej) => {
            axios({
                method: 'GET',
                url: API_URL + '/msa/' + payload
            })
                .then(res => {
                    if (res.data.response.docs.length > 0) {
                        let msa_list = res.data.response.docs[0].msa_data;
                        let msa_data = new Map();
                        let maxSeqLength = 0;
                        msa_list.forEach(m => {
                            var msaObj = JSON.parse(m);
                            let anno_id = msaObj.annotation_node_id.split(":")[1];
                            if (msaObj.full_sequence.length > maxSeqLength) {
                                maxSeqLength = msaObj.full_sequence.length;
                            }
                            msa_data.set(anno_id, msaObj.full_sequence);
                        });
                        context.state.treedata.msa_data = msa_data;
                        context.state.treedata.max_msa_length = maxSeqLength;
                        result("msa data");
                    }
                })
                .catch(error => {
                    console.log('Error while reading data (E8273): ' + JSON.stringify(error));
                    rej();
                })
        });
        
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
    [types.TABLE_ACTION_SET_MSA_FREQ]: (context, payload) => {
        context.state.treedata.freq_msa_arr = payload;
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