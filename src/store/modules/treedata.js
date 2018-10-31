import * as types from '../types_treedata';
import util from "./util";
import axios from "axios/index";

// const SOLR_URL = 'http://localhost:8983/solr/panther/select';
const SOLR_URL = 'http://54.68.67.235:8983/solr/panther/select';

const state = {
    treedata: {
        isLoading: false,
        iserror: false,
        data: null,
        jsonString: null,
        nodes: null,
        zoom: null,
        scroll: null
    }
};

const getters = {
    [types.TREE_GET_DATA]: state => {
        return state.treedata.data;
    },
    [types.TREE_GET_JSON]: state => {
        // console.log(state.treedata);
        return state.treedata.jsonString;
    },
    [types.TREE_GET_NODES]: state => {
        return state.treedata.nodes;
    },
    [types.TREE_GET_ZOOM]: state => {
        return state.treedata.zoom;
    },
    [types.TABLE_GET_SCROLL]: state => {
        return state.treedata.scroll;
    }
};

const actions = {
    [types.TREE_ACTION_SET_DATA]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.data = payload;
    },
    [types.TREE_ACTION_SET_NODES]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.nodes = payload;
    },
    [types.TREE_ACTION_SET_ZOOM]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.zoom = payload;
    },
    [types.TABLE_ACTION_SET_SCROLL]: (context, payload) => {
        //console.log("Action" + payload);
        context.state.treedata.scroll = payload;
    },
    [types.TREE_ACTION_GET_JSON]: (context, payload) => {
        console.log('Payload: ' + JSON.stringify(payload));

        var q = "";
        if(payload != null) {
            q = util.getQueryForPantherId(payload);
            if(q == "")
                q = "*:*";
        }
        console.log('QQQQ: ' + q);

        axios({
            method: 'GET',
            url: SOLR_URL +
            '?fl=' + 'jsonString' +
            '&rows=1' + '&start=0' +
            '&q=' + q
        })
            .then(res => {
                if(res.data.response.docs.length > 0) {
                    context.state.treedata.jsonString = res.data.response.docs[0].jsonString;
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
    }
};

export default {
    state,
    getters,
    actions
}