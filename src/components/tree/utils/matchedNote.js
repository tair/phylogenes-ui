import treeUtils from './commonTreeUtils';

function isMatchWithNode(d, matNodes) {
    return matNodes.find(v => v["Uniprot ID"] === d.data.uniprotId);
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
    let matNodesIds = matNodes.map(c => c["Uniprot ID"]);

    givenNode._children.forEach(c => {
        let leafs = treeUtils.getLeafNodes(c);
        let leafsIds = leafs.map(c => c.data.uniprotId);
        let matched = matNodesIds.some(id => {
            return leafsIds.includes(id);
        });
        if (!matched) {
            c._children = c.children;
            c.children = null;
        } else {
            this.collapseChildifNotMatched(c, matNodesIds);
        }
    });
    givenNode.children = givenNode._children;
    givenNode._children = null;
}

//Recursively check if a child node has a matched node as one of it's leafs, it not
// then collapses the given child node.
// matNodesIds: A list of uniprotIds for matched nodes.
function collapseChildifNotMatched(node, matNodesIds) {
    node.children.forEach(c => {
        let leafs = treeUtils.getLeafNodes(c);
        let leafsIds = leafs.map(c => c.data.uniprotId);
        let matched = matNodesIds.some(id => {
            return leafsIds.includes(id);
        });
        if (!matched) {
            c._children = c.children;
            c.children = null;
        } else {
            this.collapseChildifNotMatched(c, matNodesIds);
        }
    });
}

function findFirstMatchedNodeInTree(allLeafNodes) {
    let firstNode = allLeafNodes.find(n => {return n.matched});
    return firstNode;
}

export default {
    isMatchWithNode,
    processMatchedNodes,
    findMatNodesInChildren,
    expandSelectedFromNode,
    collapseChildifNotMatched,
    findFirstMatchedNodeInTree
}