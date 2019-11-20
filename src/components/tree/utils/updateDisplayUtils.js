import commonTreeUtils from './commonTreeUtils';

function processCompactTree(root, annoMap) {
    //First expand all nodes, incase the default view is modified by user.
    commonTreeUtils.expandAllNodes(root);
    var nodes = root.descendants();
    //If there are no annotations in the tree, use a different ruleset for collapsing nodes
    if (!annoMap) {
        this.nestedCollapseForNonAnno(nodes);
        return;
    }
    let annoKeys = Object.keys(annoMap);
    if (annoKeys.length > 0) {
        this.nestedCollapseForAnno(nodes[0], annoKeys);
    } else {
        //If there are no annotations in the tree, use a different ruleset for collapsing nodes
        this.nestedCollapseForNonAnno(nodes);
    }
}

function nestedCollapseForNonAnno(nodes) {
    // Find first-level duplication nodes.
    // A first-level duplication event here refers to an internal node that is a duplication event 
    // AND that none of its ancestral internal nodes is a duplication event.
    // We ignore root node, even if it is a duplication event.
    nodes = nodes.slice(1);
    nodes.forEach(c => {
        if (c.data.event_type === "DUPLICATION") {
            let isParentOfLeaf = true;
            if (c.children) {
                c.children.forEach(c2 => {
                    if (c2.children) {
                        commonTreeUtils.toggleChildren(c2);
                        isParentOfLeaf = false;
                    }
                });
                if (isParentOfLeaf) {
                    commonTreeUtils.toggleChildren(c);
                }
            }
        }
    });
}

//Recursively collapse nodes (if no anno found) from root to all it's children.
function nestedCollapseForAnno(node, annoKeys) {
    if (this.collapseIfNoAnnoFound(node, annoKeys)) {
        if (node.children) {
            node.children.forEach(c => {
                this.nestedCollapseForAnno(c, annoKeys);
            });
        }
    }
}

//Collapse the given node, if the no annotation is found matching the annoKeys list.
function collapseIfNoAnnoFound(node, annoKeys) {
    let leafs = commonTreeUtils.getLeafNodes(node);

    let ifAnnoFound = leafs.some(l => {
        let uniprotId = "";
        if (l.data.uniprotId) {
            uniprotId = l.data.uniprotId.toLowerCase();
        }
        return annoKeys.includes(uniprotId);
    });
    if (!ifAnnoFound) {
        commonTreeUtils.toggleChildren(node);
    }
    return ifAnnoFound;
}

export default {
    processCompactTree,
    nestedCollapseForNonAnno,
    nestedCollapseForAnno,
    collapseIfNoAnnoFound
}