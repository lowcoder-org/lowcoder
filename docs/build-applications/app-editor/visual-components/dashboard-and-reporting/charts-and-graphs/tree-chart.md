# Tree Chart

#### 🌳 Tree Chart – Unfold Hierarchies, One Branch at a Time

The **Tree Chart** component in **Lowcoder** is a powerful visualization tool for displaying **hierarchical structures** in a clear, branching format. Whether you're mapping relationships, categories, or structures, this chart turns nested data into an interactive, expandable tree — from root to leaf.

#### 🧭 Ideal For:

* **Organisational structures** (CEO → Managers → Teams)
* **Folder/file systems**
* **Family trees or genealogies**
* **Taxonomies or classification models**

#### 🧩 Sample Data Structure

Tree Charts use a nested object format, where each node can contain child nodes:

```json
{
  "name": "Company",
  "children": [
    {
      "name": "Engineering",
      "children": [
        { "name": "Frontend" },
        { "name": "Backend" }
      ]
    },
    {
      "name": "Sales"
    }
  ]
}
```

Each node can have additional metadata, labels, or styles attached.

#### ⚙️ Key Configuration Options

* **Chart Type:** Drag “Tree Chart” from the components section onto Editor's View
* **Orientation:** Display the tree **vertically**, **horizontally**, or **radially**
* **Collapsibility:** Expand or collapse branches for better focus
* **Node Labels & Tooltips:** Show contextual information on hover

#### 🎨 Custom Styling

* Customize **node shapes, sizes, and colors**
* Style **edges** between nodes (curved, straight, dashed)
* Control **animation** and transition effects
* Use **ECharts JSON editor** for fine-grained control (e.g., node alignment, depth spacing)

### Component Playground

{% embed url="https://app.lowcoder.cloud/playground/treeChart/1" %}

### Component Auto-Docs

{% embed url="https://app.lowcoder.cloud/components/treeChart" %}
