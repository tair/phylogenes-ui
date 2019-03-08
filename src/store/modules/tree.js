import * as types from '../types_tree';
import axios from "axios/index";
import util from "./util";

// const SOLR_URL = 'http://localhost:8983/solr/panther/select';
const SOLR_URL = 'http://54.68.67.235:8983/solr/panther/select';
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
        var q = "", fq = "";
        if(payload != null) {
            context.state.tree.payload = payload;
            q = util.buildGeneralQuery(context.state.tree.payload);
            fq = util.buildFieldQuery(context.state.tree.payload);
        }

        context.state.tree.isLoading = true;
        axios({
            method: 'GET',
            url: SOLR_URL +
            '?facet.field=node_types&facet.field=organisms&facet.field=species_list&facet=on' +
            '&fl=id,%20sf_names,%20family_name,%20node_types,%20gene_symbols,%20uniprot_ids' +
            '&rows=' + context.state.tree.payload.filters.rows +
            '&start=' + context.state.tree.payload.filters.startRow +
            '&q=' + q +
            '&fq=' + fq +
            '&hl=on&hl.fl=sf_names,%20gene_symbols,%20family_name'
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
                        jsonData['key'] = res.data.facet_counts.facet_fields.species_list[i++];
                        jsonData['count'] = res.data.facet_counts.facet_fields.species_list[i++];
                        context.state.tree.data.facets.species.push(jsonData);
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
        var q = "", fq = "";
        if(payload != null) {
            context.state.tree.payload.filters = payload;
            q = util.buildGeneralQuery(context.state.tree.payload);
            fq = util.buildFieldQuery(context.state.tree.payload);
        }
        // console.log('Solr Query: ' + q + ' Filter Query: ' + fq);

        axios({
            method: 'GET',
            url: SOLR_URL +
            '?facet.field=node_types&facet.field=organisms&facet.field=species_list&facet=on' +
            '&fl=id,%20sf_names,%20family_name,%20node_types,%20gene_symbols,%20uniprot_ids' +
            '&rows=' + context.state.tree.payload.filters.rows +
            '&start=' + context.state.tree.payload.filters.startRow +
            '&q=' + q +
            '&fq=' + fq +
            '&hl=on&hl.fl=sf_names,%20gene_symbols,%20family_name'
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



