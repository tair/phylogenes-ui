import Vue from 'vue'
import Vuex from 'vuex'

import tree from './store/modules/tree';

Vue.use(Vuex)

export const store = new Vuex.Store({
    modules: {
        tree
    }
});

