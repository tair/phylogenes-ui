import * as types from '../types_tree';
import axios from "axios/index";
import util from "./util.js";

// const SOLR_URL = 'http://localhost:8983/solr/panther/select';
const SOLR_URL = 'http://54.68.67.235:8983/solr/panther/select';

const state = {
    tree: {
        isLoading: false,
        isError: false,
        data: {
            results: [],
            numFound: 0,
            startRow: 0,
            rows: 10,
            queryTime: 0,
            facets: {
                nodeTypes: [],
                organisms: [],
                species: []
            }
        },
        filters: {
            startRow: 0,
            rows: 10,
            searchText: null,
            familyName: null,
            uniprotId: null,
            nodeTypes: [],
            organisms: [],
            species: []
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
    [types.TREE_GET_DATA]: state => {
        return state.tree.data;
    },
    [types.TREE_GET_FILTERS]: state => {
        return state.tree.filters;
    },
};

const mutations = {

};

const actions = {

    [types.TREE_ACTION_PAGINATE]: (context, payload) => {

        console.log('Payload: ' + JSON.stringify(payload));

        var q = "";
        if(payload != null) {
            q = util.buildSolrQuery(context.state.tree.filters);
            if(q == "")
                q = "*:*";
        }
        console.log('QQQQ: ' + q);

        axios({
            method: 'GET',
            url: SOLR_URL +
            '?facet.field=node_types&facet.field=organisms&facet.field=species_list&facet=on' +
            '&fl=id,%20sf_names,%20family_name,%20node_types,%20gene_symbols,%20uniprot_ids' +
            '&rows=' + context.state.tree.filters.rows +
            '&start=' + context.state.tree.filters.startRow +
            '&q=' + q
        })
            .then(res => {

                // tree data
                context.state.tree.data.results = res.data.response.docs;
                context.state.tree.data.queryTime = res.data.responseHeader.QTime;
                context.state.tree.data.rows = res.data.responseHeader.params.rows;
                context.state.tree.data.startRow = res.data.response.start;

            })
            .catch(error => {
                console.log('Error while reading data (E8273): ' + JSON.stringify(error));
            })
    },

    [types.TREE_ACTION_FILTER]: (context, payload) => {

        payload.startRow = 0;
        console.log('Payload: ' + JSON.stringify(payload));

        var q = "";
        if(payload != null) {
            context.state.tree.filters = payload;
            context.state.tree.filters.searchText = payload.familyName;
            q = util.buildSolrQuery(payload);
            if(q == "")
                q = "*:*";
        }
        console.log('QQQQ: ' + q);

        context.state.tree.isLoading = true;
        context.state.tree.isError = false;

        axios({
            method: 'GET',
            url: SOLR_URL +
                '?facet.field=node_types&facet.field=organisms&facet.field=species_list&facet=on' +
                '&fl=id,%20sf_names,%20family_name,%20node_types,%20gene_symbols,%20uniprot_ids' +
                '&rows=' + context.state.tree.filters.rows +
                '&start=' + context.state.tree.filters.startRow +
                '&q=' + q
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

                context.state.tree.isLoading = false;
            })
            .catch(error => {
                context.state.tree.isLoading = false;
                context.state.tree.isError = true;

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



