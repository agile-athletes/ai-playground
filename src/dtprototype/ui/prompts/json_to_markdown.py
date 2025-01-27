# Copyright (c) 2025 Agile Athletes GmbH.
# The source is part of the open-source project https://github.com/agile-athletes/ai-playground
# and is distributed under the terms of the MIT licence.

from typing import List, Dict, Optional

class JsonToMarkdownConverter:
    def __init__(self, json_data: Dict):
        """
        Initializes the converter with JSON data.

        :param json_data: The JSON data as a dictionary.
        """
        self.json_data = json_data
        self.attentions = self.json_data.get("attentions", [])
        self.tree = self.build_tree()
        self.name_to_node = self.map_names_to_nodes()

    class Node:
        def __init__(self, id: int, name: str, value: str):
            self.id = id
            self.name = name
            self.value = value
            self.children: List['JsonToMarkdownConverter.Node'] = []

    def build_tree(self) -> List['JsonToMarkdownConverter.Node']:
        """
        Builds a tree from the flat list of attentions based on parent_id.

        :return: A list of root nodes.
        """
        nodes = {}
        roots = []

        # Create all nodes and store them in a dictionary
        for item in self.attentions:
            node = self.Node(item["id"], item["name"], item["value"])
            nodes[node.id] = node

        # Assign children to their respective parents
        for item in self.attentions:
            node = nodes[item["id"]]
            parent_id = item.get("parent_id")
            if parent_id is None:
                roots.append(node)
            else:
                parent_node = nodes.get(parent_id)
                if parent_node:
                    parent_node.children.append(node)
                else:
                    # If parent_id does not exist, treat as root
                    roots.append(node)

        return roots

    def map_names_to_nodes(self) -> Dict[str, 'JsonToMarkdownConverter.Node']:
        """
        Creates a mapping from node names to Node objects for quick lookup.

        :return: A dictionary mapping names to Node objects.
        """
        name_to_node = {}
        for node in self.attentions:
            name_to_node[node["name"]] = self.find_node_by_id(node["id"])
        return name_to_node

    def find_node_by_id(self, node_id: int) -> 'Node':
        """
        Finds a node in the tree by its ID.

        :param node_id: The ID of the node to find.
        :return: The Node object if found, else None.
        """
        # Perform a breadth-first search to find the node
        queue = self.tree.copy()
        while queue:
            current = queue.pop(0)
            if current.id == node_id:
                return current
            queue.extend(current.children)
        return None

    def to_markdown(self) -> str:
        """
        Converts the JSON data to a Markdown formatted string based on the hierarchy.

        :return: A string containing the formatted Markdown.
        """
        markdown_lines = []
        for root in self.tree:
            self._traverse_node(root, 1, markdown_lines)
        return "\n\n".join(markdown_lines)

    def _traverse_node(self, node: 'JsonToMarkdownConverter.Node', level: int, markdown_lines: List[str]):
        """
        Recursively traverses the tree and appends formatted Markdown lines.

        :param node: The current node.
        :param level: The current depth level in the tree.
        :param markdown_lines: The list accumulating Markdown lines.
        """
        header_prefix = "#" * level
        # Combine name and value
        header = f"{header_prefix} {node.name}"
        content = node.value

        markdown_lines.append(header)
        markdown_lines.append(content)

        for child in node.children:
            self._traverse_node(child, level + 1, markdown_lines)

    def get_children_by_name(self, name: str) -> List[Dict]:
        """
        Retrieves the children of a node identified by its name.

        :param name: The name of the node whose children are to be retrieved.
        :return: A list of child nodes as dictionaries in the order they appear in the JSON.
        """
        node = self.name_to_node.get(name)
        if not node:
            print(f"No node found with the name '{name}'.")
            return []

        # Extract children and convert them to dictionaries
        children = node.children
        # To maintain the original order as in JSON, sort based on their appearance in self.attentions
        id_order = {item["id"]: index for index, item in enumerate(self.attentions)}
        children_sorted = sorted(children, key=lambda x: id_order.get(x.id, 0))

        return [{"id": child.id, "name": child.name, "value": child.value, "weight": self.get_weight(child.id), "parent_id": node.id} for child in children_sorted]

    def get_weight(self, node_id: int) -> Optional[str]:
        """
        Retrieves the weight of a node by its ID.

        :param node_id: The ID of the node.
        :return: The weight as a string if found, else None.
        """
        for item in self.attentions:
            if item["id"] == node_id:
                return item.get("weight")
        return None
