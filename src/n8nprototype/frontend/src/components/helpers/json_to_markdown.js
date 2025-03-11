export class JsonToMarkdownConverter {
    constructor(attentions) {
        // Initialize with JSON data
        this.attentions = attentions || [];
        this.tree = this.buildTree();
        this.nameToNode = this.mapNamesToNodes();
    }

    // Node class representing each node in the tree
    static Node = class {
        constructor(id, name, value) {
            this.id = id;
            this.name = name;
            this.value = value;
            this.children = [];
        }
    };

    // Builds the tree structure from the flat list of attentions
    buildTree() {
        const nodes = {};
        const roots = [];

        // Create all nodes and store them in a dictionary keyed by id
        for (const item of this.attentions) {
            const node = new JsonToMarkdownConverter.Node(item.id, item.name, item.value);
            nodes[node.id] = node;
        }

        // Assign children to their respective parents
        for (const item of this.attentions) {
            const node = nodes[item.id];
            const parentId = item.parent_id;
            if (parentId === undefined || parentId === null) {
                roots.push(node);
            } else {
                const parentNode = nodes[parentId];
                if (parentNode) {
                    parentNode.children.push(node);
                } else {
                    // If parent_id does not exist, treat as root
                    roots.push(node);
                }
            }
        }
        return roots;
    }

    // Creates a mapping from node names to Node objects for quick lookup
    mapNamesToNodes() {
        const nameToNode = {};
        for (const item of this.attentions) {
            const node = this.findNodeById(item.id);
            if (node) {
                nameToNode[item.name] = node;
            }
        }
        return nameToNode;
    }

    // Finds a node in the tree by its id using a breadth-first search
    findNodeById(nodeId) {
        const queue = [...this.tree];
        while (queue.length) {
            const current = queue.shift();
            if (current.id === nodeId) {
                return current;
            }
            queue.push(...current.children);
        }
        return null;
    }

    // Converts the JSON data to a Markdown formatted string based on the hierarchy
    toMarkdown() {
        const markdownLines = [];
        for (const root of this.tree) {
            this._traverseNode(root, 1, markdownLines);
        }
        return markdownLines.join("\n\n");
    }

    // Recursively traverses the tree and appends formatted Markdown lines
    _traverseNode(node, level, markdownLines) {
        const headerPrefix = "#".repeat(level);
        const header = `${headerPrefix} ${node.name}`;
        const content = node.value;

        markdownLines.push(header);
        markdownLines.push(content);

        for (const child of node.children) {
            this._traverseNode(child, level + 1, markdownLines);
        }
    }

    // Retrieves the children of a node identified by its name, preserving original JSON order
    getChildrenByName(name) {
        const node = this.nameToNode[name];
        if (!node) {
            return [];
        }
        const children = node.children;
        // Create a mapping from id to index based on their appearance in attentions
        const idOrder = {};
        this.attentions.forEach((item, index) => {
            idOrder[item.id] = index;
        });
        // Sort children based on original order
        const childrenSorted = children.sort((a, b) => {
            return (idOrder[a.id] || 0) - (idOrder[b.id] || 0);
        });
        // Return the children as objects with the required properties
        return childrenSorted.map(child => ({
            id: child.id,
            name: child.name,
            value: child.value,
            weight: this.getWeight(child.id),
            parent_id: node.id
        }));
    }

    // Retrieves the weight of a node by its id from the original attentions list
    getWeight(nodeId) {
        for (const item of this.attentions) {
            if (item.id === nodeId) {
                return item.weight;
            }
        }
        return undefined;
    }
}
