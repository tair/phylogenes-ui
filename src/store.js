import Vue from 'vue'
import Vuex from 'vuex'

import tree from './store/modules/tree';
import treedata from './store/modules/treedata';

Vue.use(Vuex)

export const store = new Vuex.Store({
    modules: {
        tree,
        treedata
    }
});

