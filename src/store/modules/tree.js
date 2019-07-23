import * as types from '../types_tree';
import axios from "axios/index";

// const API_URL = 'http://localhost:3000/api/panther';
const API_URL = 'http://54.68.67.235:3000/api/panther';
// const API_URL = 'http://52.37.99.223:3000/api/panther';
const DEFAULT_ROWS = 20;

const state = {
    tree: {
        isLoading: false,
        isError: false,
        data: {
            results: [],
            numFound: 0,
            startRow: 0,
            rows: DEFAULT_ROWS,
            queryTime: 0,
            facets: {
                nodeTypes: [],
                organisms: [],
                species: []
            },
            highlighted: null
        },
        payload: {
            searchText: null,
            filters: {
                startRow: 0,
                rows: DEFAULT_ROWS,
                familyName: null,
                uniprotId: null,
                nodeTypes: [],
                organisms: [],
                species: []
            }
        }
    }
};

const getters = {
    [types.TREE_IS_ERROR]: state => {
        return state.tree.isError;
    },
    [types.TREE_IS_LOADING]: state => {
        return state.tree.isLoading;
    },
    [types.TREE_GET_SEARCH_TEXT]: state => {
        return state.tree.payload.searchText;
    },
    [types.TREE_GET_DATA]: state => {
        return state.tree.data;
    },
    [types.TREE_GET_FILTERS]: state => {
        return state.tree.payload.filters;
    },
};

const mutations = {

};

const actions = {
    [types.TREE_ACTION_RESET_SEARCH]: (context, payload) => {
        var payload = {
            searchText: null,
            filters: {
                startRow: 0,
                rows: DEFAULT_ROWS,
                familyName: null,
                uniprotId: null,
                nodeTypes: [],
                organisms: [],
                species: []
            }
        };

        context.state.tree.payload = payload;
    },
    [types.TREE_ACTION_RESET_FILTER]: (context) => {
        var filters= {
                startRow: 0,
                rows: DEFAULT_ROWS,
                familyName: null,
                uniprotId: null,
                nodeTypes: [],
                organisms: [],
                species: []
        };

        context.state.tree.payload.filters = filters;
    },
    [types.TREE_ACTION_SET_FILTER]: (context, payload) => {
        context.state.tree.payload.filters = payload;
    },
    [types.TREE_ACTION_SET_SEARCH]: (context, payload) => {
        context.state.tree.payload.searchText = payload;
    },
    [types.TREE_ACTION_DO_SEARCH]: (context, payload) => {
        if(payload != null) {
            context.state.tree.payload = payload;
        }
        const {searchText, filters:{startRow, rows, species, organisms}} = context.state.tree.payload;
        context.state.tree.isLoading = true;
        axios({
            method: 'POST',
            url: API_URL+'/search',
            data: {
                searchText: searchText,
                start: startRow,
                rows: rows,
                species: species,
                organisms: organisms,
                facet: 'on'
            }
        })
            .then(res => {
                // tree data
                context.state.tree.data.results = res.data.response.docs;
                context.state.tree.data.queryTime = res.data.responseHeader.QTime;
                context.state.tree.data.numFound = res.data.response.numFound;
                context.state.tree.data.rows = res.data.responseHeader.params.rows;
                context.state.tree.data.startRow = res.data.response.start;

                // tree facets ///////////////////////
                context.state.tree.data.facets.nodeTypes = [];
                context.state.tree.data.facets.organisms = [];
                context.state.tree.data.facets.species = [];

                if(res.data.facet_counts.facet_fields.node_types != null) {
                    for(var i = 0; i < res.data.facet_counts.facet_fields.node_types.length;) {
                        var jsonData = {};
                        jsonData['key'] = res.data.facet_counts.facet_fields.node_types[i++];
                        jsonData['count'] = res.data.facet_counts.facet_fields.node_types[i++];
                        context.state.tree.data.facets.nodeTypes.push(jsonData);
                    }
                }

                if(res.data.facet_counts.facet_fields.organisms != null) {
                    for(var i = 0; i < res.data.facet_counts.facet_fields.organisms.length;) {
                        var jsonData = {};
                        jsonData['key'] = res.data.facet_counts.facet_fields.organisms[i++];
                        jsonData['count'] = res.data.facet_counts.facet_fields.organisms[i++];
                        context.state.tree.data.facets.organisms.push(jsonData);
                    }
                }                                              

                if(res.data.facet_counts.facet_fields.species_list != null) {
                    for(var i = 0; i < res.data.facet_counts.facet_fields.species_list.length;) {
                        var jsonData = {};
                        let key = res.data.facet_counts.facet_fields.species_list[i++];
                        let count = res.data.facet_counts.facet_fields.species_list[i++]
                        if(count > 0) {
                            jsonData['key'] = key;
                            jsonData['count'] = count;
                            context.state.tree.data.facets.species.push(jsonData);
                        }
                    }
                }
                //////////////////////////////////////
                // Highlighted Fields ///////////////////////////////
                if(res.data.highlighting) {
                    var highlightArr = Object.keys(res.data.highlighting).map((key) => {
                        return [key, res.data.highlighting[key]];
                    });

                    context.state.tree.data.results.forEach((r, i) => {
                      r.hl = highlightArr[i];
                    });
                }

                //////////////////////////////////////

                context.state.tree.isLoading = false;
            })
            .catch(error => {
                context.state.tree.isLoading = false;
                context.state.tree.isError = true;

                console.log('Error while reading data (E8273): ' + JSON.stringify(error));
            })
    },

    [types.TREE_ACTION_PAGINATE]: (context, payload) => {
        if(payload != null) {
            context.state.tree.payload.filters = payload;
        }
        const {searchText, filters:{startRow, rows, species, organisms}} = context.state.tree.payload;
        axios({
            method: 'POST',
            url: API_URL+'/search',
            data: {
                searchText: searchText,
                start: startRow,
                rows: rows,
                species: species,
                organisms: organisms,
                facet: 'off'
            }
        })
            .then(res => {

                // tree data
                context.state.tree.data.results = res.data.response.docs;
                context.state.tree.data.queryTime = res.data.responseHeader.QTime;
                context.state.tree.data.rows = res.data.responseHeader.params.rows;
                context.state.tree.data.startRow = res.data.response.start;

                // Highlighted Fields ///////////////////////////////
                if(res.data.highlighting) {
                    var highlightArr = Object.keys(res.data.highlighting).map((key) => {
                        return [key, res.data.highlighting[key]];
                    });
                    context.state.tree.data.results.forEach((r, i) => {
                        r.hl = highlightArr[i];
                    });
                }
                //////////////////////////////////////
            })
            .catch(error => {
                console.log('Error while reading data (E8273): ' + JSON.stringify(error));
            })
    }
};

export default {
    state,
    getters,
    actions,
    mutations
}



