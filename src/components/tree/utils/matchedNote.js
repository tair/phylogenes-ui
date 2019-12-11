import treeUtils from './commonTreeUtils';

function isMatchWithNode(d, matNodes) {
    
    return matNodes.find(v => {
        let uniprotId = v["Uniprot ID"];
        if (uniprotId) {
            return uniprotId === d.data.uniprotId;
        } else {
            return v["accession"] === d.data.accession;
        }
    });
}

function isGraftedNode(d) {
    if (d.data.newGrafted || d.newGrafted) {
        return true;
    }
    return false;
}

async function processGrafted(allNodes) {
    var foundAnywhere = false;
    allNodes.some(d => {
        d.matched = false;
        //If Leaf Node
        if (!d.children && !d._children) {
            if (d.data.accession == "ANGRAFTED") {
                foundAnywhere = true;
            }
        }
        if (d._children) {
            if (findGraftedNodesInChildren(d)) {
                foundAnywhere = true;
                expandFromSelected(d);
            }
        }
        return foundAnywhere == true;
    });
    allNodes.forEach(a => {
        if (isGraftedNode(a)) {
            a.grafted = true;
        }
    });
    return 1;
}

function expandFromSelected(d) {
    if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    if (d.children) {
        d.children.forEach(dc => {
            if (dc.graftInC) {
                expandFromSelected(dc);
            } else {
                collapseNode(dc);
            }
        });
    }
}

function collapseNode(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    }
}

function findGraftedNodesInChildren(d) {
    var foundAny = false;
    if (d.children) {
        d.children.forEach(dc => {
            let found = isGraftedNode(dc);
            if (found) {
                dc.grafted = true;
                foundAny = true;
            }
            var ff = findGraftedNodesInChildren(dc);
            if (ff) {
                dc.graftInC = true;
                foundAny = true;
            }
        });
    }
    if (d._children) {
        d._children.forEach(dc => {
            let found = isGraftedNode(dc);
            if (found) {
                dc.grafted = true;
                foundAny = true;
            }
            var ff = findGraftedNodesInChildren(dc);
            if (ff) {
                dc.graftInC = true;
                foundAny = true;
            }
        });
    }
    return foundAny;
}

async function processMatchedNodes(allNodes, matchedNodes) {
    if (matchedNodes.length == 0) {
        //reset all nodes (clears the red color on matched if any)
        allNodes.forEach(d => {
            d.matched = false;
        });
        return 1;
    }

    allNodes.forEach(d => {
        d.matched = false;
        if (!d.children) {
            let found = this.isMatchWithNode(d, matchedNodes);
            if (found) {
                //the node is set to red color during rendering call
                d.matched = true;
            }
        }
        if (d._children) {
            if (this.findMatNodesInChildren(d, matchedNodes)) {
                this.expandSelectedFromNode(d, matchedNodes);
            }
        }
    });
    return 1;
}

function findMatNodesInChildren(d, matNodes) {
    var foundAny = false;
    if (d.children) {
        d.children.forEach(dc => {
            let found = this.isMatchWithNode(dc, matNodes);
            if (found) {
                dc.matched = true;
                foundAny = true;
            }
            var ff = this.findMatNodesInChildren(dc, matNodes);
            if (ff) {
                foundAny = true;
            }
        });
    }
    if (d._children) {
        d._children.forEach(dc => {
            let found = this.isMatchWithNode(dc, matNodes);
            if (found) {
                dc.matched = true;
                foundAny = true;
            }
            var ff = this.findMatNodesInChildren(dc, matNodes);
            if (ff) {
                foundAny = true;
            }
        });
    }
    return foundAny;
}

//Expands only the nodes which have a matched node as one of it's leafs,
// else keeps the other nodes collapsed
function expandSelectedFromNode(givenNode, matNodes) {
    if (givenNode._children && givenNode._children != null) {
        givenNode.children = givenNode._children;
        givenNode._children = null;
    }
    
    if (givenNode.children) {
        givenNode.children.forEach(c => {
            if (this.findMatNodesInChildren(c, matNodes)) {
                this.expandSelectedFromNode(c, matNodes);
            } else {
                c._children = c.children;
                c.children = null;
            }
        });
    }
}

function findFirstMatchedNodeInTree(allLeafNodes) {
    let firstNode = allLeafNodes.find(n => {return n.matched});
    return firstNode;
}

function findAllMatchedNodes(allLeafNodes) {
    return allLeafNodes.filter(n => { return n.matched });
}

export default {
    isMatchWithNode,
    processMatchedNodes,
    processGrafted,
    findMatNodesInChildren,
    expandSelectedFromNode,
    findFirstMatchedNodeInTree,
    findAllMatchedNodes
}