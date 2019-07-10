//Get all leaf nodes from the given node 'n'
function getLeafNodes(n) {
    let leafs = [];
    if (n.children) {
        n.children.forEach(c => {
            if (this.isALeafNode(c)) {
                leafs.push(c);
            } else {
                let ls = this.getLeafNodes(c);
                leafs = leafs.concat(ls);
            }
        });
    }
    return leafs;
}

function isALeafNode(n) {
    return !n.children && !n._children;
}

//Expands all the nodes from a given node if it's collapsed in the tree
function expandAllFromNode(givenNode) {
    if (givenNode._children) {
        givenNode.children = givenNode._children;
        givenNode._children = null;
    }
    if (givenNode.children) {
        givenNode.children.forEach(n => {
            this.expandAllFromNode(n);
        });
    }
}

export default {
    getLeafNodes,
    isALeafNode,
    expandAllFromNode
}