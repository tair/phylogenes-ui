function buildSolrQuery(payload) {
    var q = "";
    if(payload.familyName != null && payload.familyName != '') {
        q += " AND family_name:\"" + payload.familyName + "\" ";
    }

    if(payload.uniprotId != null && payload.uniprotId != '') {
        q += " AND uniprot_ids:\"" + payload.uniprotId + "\" ";
    }

    var species_filters = "";
    for (var i = 0; i < payload.species.length; i++) {
        species_filters += " AND species_list:\"" + payload.species[i] + "\"";
    }
    species_filters = species_filters.substr(5);
    if (species_filters != "")
        q += " AND " + species_filters;

    var organisms_filters = "";
    for (var i = 0; i < payload.organisms.length; i++) {
        organisms_filters += " AND organisms:\"" + payload.organisms[i] + "\"";
    }
    organisms_filters = organisms_filters.substr(5);
    if (organisms_filters != "")
        q += " AND " + organisms_filters;

    var ntype_filters = "";
    for (var i = 0; i < payload.nodeTypes.length; i++) {
        ntype_filters += " AND node_types:\"" + payload.nodeTypes[i] + "\"";
    }
    ntype_filters = ntype_filters.substr(5);
    if (ntype_filters != "")
        q += " AND " + ntype_filters;
    q = q.substr(5);
    return q;
}

function buildGeneralQuery(payload) {
    var q = "";
    if(payload.searchText != null && payload.searchText != "") {
        q += " AND gene_symbols:\"" + payload.searchText + "\"^10";
        q += " OR sf_names:\"" + payload.searchText + "\" ";
        q += " OR uniprot_ids:\"" + payload.searchText + "\" ";
        q += " OR family_name:\"" + payload.searchText + "\" ";
    }
    q = q.substr(5);
    if(q == "")
        q = "*:*";
    return q;
}

function buildFieldQuery(payload) {
    var fq = "";
    var species_filters = "";
    for (var i = 0; i < payload.filters.species.length; i++) {
        species_filters += " AND species_list:\"" + payload.filters.species[i] + "\"";
    }
    species_filters = species_filters.substr(5);
    if (species_filters != "") {
        fq += " AND " + species_filters;
    }

    var organisms_filters = "";
    for (var i = 0; i < payload.filters.organisms.length; i++) {
        organisms_filters += " AND organisms:\"" + payload.filters.organisms[i] + "\"";
    }
    organisms_filters = organisms_filters.substr(5);
    if (organisms_filters != "")
        fq += " AND " + organisms_filters;

    fq = fq.substr(5);
    if(fq == "") {
        fq = "*:*"
    }
    return fq;
}

function getQueryForPantherId(id) {
    var q = "";
    q = "id: " + id;
    return q;
}

module.exports = {
    buildSolrQuery,
    buildGeneralQuery,
    buildFieldQuery,
    getQueryForPantherId
};