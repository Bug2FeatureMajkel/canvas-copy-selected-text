# Canvas Copy Selected Text

An [Obsidian](https://obsidian.md) plugin that lets you **copy text content from selected canvas nodes** to your clipboard with a single shortcut.

## Features

- **Copy selected nodes** — select one or more nodes on a canvas and copy their text content
- **Copy all nodes** — copy every node's text from the entire canvas at once
- **Configurable output formats:**
  - Plain text with separator
  - Markdown code blocks
  - Numbered list (1. 2. 3.)
  - Bullet list
- **Filter by node type** — choose whether to include/exclude:
  - Files (images, PDFs, etc.)
  - Groups
  - Links
- **Customizable separator** between nodes (e.g. `---`, `=====`, blank line)
- **Optional node labels** — prepend `[Node 1]`, `[Node 2]`, etc.

## Usage

1. Open a **Canvas** file in Obsidian.
2. **Select nodes** you want to copy (click a node, or Ctrl/Cmd + click for multiple).
3. Use one of the commands:

| Command | Default Hotkey | Description |
|---|---|---|
| **Copy selected nodes** | `Ctrl/Cmd + Shift + C` | Copies only selected nodes |
| **Copy ALL nodes** | `Ctrl/Cmd + Shift + A` | Copies every node on the canvas |

You can also click the **copy icon** in the ribbon (left sidebar) to copy selected nodes.

> **Tip:** You can change hotkeys in **Settings → Hotkeys** — search for "Canvas Copy".

## Settings

(edit main.js)

| Setting | Description | Default |
|---|---|---|
| Include images/files | Include file nodes (images, PDFs, etc.) | Off |
| Include groups | Include group labels | On |
| Include links | Include URL link nodes | On |
| Copy format | Plain / Markdown / Numbered / Bullets | Plain |
| Separator | Text between nodes | `---` |
| Add node labels | Prepend [Node 1], [Node 2], etc. | Off |

## Installation

### From Community Plugins (recommended)

1. Open Obsidian **Settings → Community Plugins**
2. Click **Browse** and search for **"Canvas Copy Selected Text"**
3. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/Bug2FeatureMajkel/canvas-copy-selected-text/releases)
2. Create a folder: `<your-vault>/.obsidian/plugins/canvas-copy-selected/`
3. Place `main.js` and `manifest.json` into that folder
4. Restart Obsidian and enable the plugin in **Settings → Community Plugins**

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/Bug2FeatureMajkel/canvas-copy-selected-text/issues) on GitHub.

## License

[MIT](LICENSE) — free to use, free to modify. Original author: Bug2FeatureMajkel.
