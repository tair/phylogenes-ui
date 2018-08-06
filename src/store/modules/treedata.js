import * as types from '../types_treedata';

const state = {
    treedata: {
        isLoading: false,
        iserror: false,
        data: null,
        nodes: null,
        zoom: null
    }
};

const getters = {
    [types.TREE_GET_DATA]: state => {
        return state.treedata.data;
    },
    [types.TREE_GET_NODES]: state => {
        return state.treedata.nodes;
    },
    [types.TREE_GET_ZOOM]: state => {
        return state.treedata.zoom;
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
    }
};

export default {
    state,
    getters,
    actions
}