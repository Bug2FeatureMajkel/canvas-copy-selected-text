/*
 * Canvas Copy Selected Text
 * Copy text content from selected canvas nodes to clipboard.
 * Author: Bug2FeatureMajkel
 * License: MIT
 */

'use strict';

var obsidian = require('obsidian');

const DEFAULT_SETTINGS = {
  includeImages: false,
  includeGroups: true,
  includeLinks: true,
  separator: '---',
  addNodeLabels: false,
  copyFormat: 'plain',
};

// ============================================
// Settings Tab
// ============================================
class CanvasCopySettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Canvas Copy Selected — Settings' });

    containerEl.createEl('p', {
      text: '⌨️ Configure hotkeys in: Settings → Hotkeys → search "Canvas Copy"',
      attr: { style: 'color: var(--text-muted); font-size: 13px; margin-bottom: 20px;' }
    });

    // --- Section: What to copy ---
    containerEl.createEl('h3', { text: '📋 What to copy' });

    new obsidian.Setting(containerEl)
      .setName('Include images / files')
      .setDesc('Whether to include file nodes (images, PDFs, etc.).')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeImages)
          .onChange(async (value) => {
            this.plugin.settings.includeImages = value;
            await this.plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName('Include groups')
      .setDesc('Whether to include group labels.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeGroups)
          .onChange(async (value) => {
            this.plugin.settings.includeGroups = value;
            await this.plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName('Include links')
      .setDesc('Whether to include URL link nodes.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeLinks)
          .onChange(async (value) => {
            this.plugin.settings.includeLinks = value;
            await this.plugin.saveSettings();
          })
      );

    // --- Section: Output format ---
    containerEl.createEl('h3', { text: '🎨 Output format' });

    new obsidian.Setting(containerEl)
      .setName('Copy format')
      .setDesc('How copied nodes should be formatted.')
      .addDropdown((drop) =>
        drop
          .addOption('plain', 'Plain — text with separator')
          .addOption('markdown', 'Markdown — code blocks')
          .addOption('numbered', 'Numbered — 1. 2. 3.')
          .addOption('bullets', 'Bullets — dash list')
          .setValue(this.plugin.settings.copyFormat)
          .onChange(async (value) => {
            this.plugin.settings.copyFormat = value;
            await this.plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName('Separator between nodes')
      .setDesc('E.g. --- or ===== or an empty line.')
      .addText((text) =>
        text
          .setPlaceholder('---')
          .setValue(this.plugin.settings.separator)
          .onChange(async (value) => {
            this.plugin.settings.separator = value;
            await this.plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName('Add node labels')
      .setDesc('Whether to prepend [Node 1], [Node 2] before each node.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.addNodeLabels)
          .onChange(async (value) => {
            this.plugin.settings.addNodeLabels = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

// ============================================
// Main Plugin Class
// ============================================
class CanvasCopySelected extends obsidian.Plugin {
  async onload() {
    console.log('Canvas Copy Selected: loaded');

    await this.loadSettings();

    this.addSettingTab(new CanvasCopySettingTab(this.app, this));

    // Command: Copy selected nodes
    this.addCommand({
      id: 'copy-selected-nodes',
      name: 'Copy selected nodes',
      checkCallback: (checking) => {
        const canvasView = this.getActiveCanvasView();
        if (canvasView) {
          if (!checking) {
            this.copySelectedNodes(canvasView);
          }
          return true;
        }
        return false;
      },
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'C',
        },
      ],
    });

    // Command: Copy ALL nodes from canvas
    this.addCommand({
      id: 'copy-all-nodes',
      name: 'Copy ALL nodes from canvas',
      checkCallback: (checking) => {
        const canvasView = this.getActiveCanvasView();
        if (canvasView) {
          if (!checking) {
            this.copyAllNodes(canvasView);
          }
          return true;
        }
        return false;
      },
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'A',
        },
      ],
    });

    // Ribbon icon for quick access
    this.addRibbonIcon('copy', 'Canvas Copy: selected nodes', () => {
      const canvasView = this.getActiveCanvasView();
      if (canvasView) {
        this.copySelectedNodes(canvasView);
      } else {
        new obsidian.Notice('Open a Canvas file first.');
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * Returns the active canvas view if the current file is a canvas,
   * otherwise returns null.
   */
  getActiveCanvasView() {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf) return null;
    const view = activeLeaf.view;
    if (view.getViewType() !== 'canvas') return null;
    return view;
  }

  // ============================================
  // Extract text content from a single canvas node
  // Uses multiple fallback strategies since the
  // internal canvas API is not officially documented.
  // ============================================
  extractNodeContent(nodeElement) {
    let data = null;

    // Strategy 1: getData() method
    try {
      if (typeof nodeElement.getData === 'function') {
        data = nodeElement.getData();
      }
    } catch (e) {
      // silently ignore
    }

    // Strategy 2: nodeData property
    if (!data && nodeElement.nodeData) {
      data = nodeElement.nodeData;
    }

    // Strategy 3: unknownData property
    if (!data && nodeElement.unknownData) {
      data = nodeElement.unknownData;
    }

    // Strategy 4: nested .node property
    if (!data && nodeElement.node) {
      data = nodeElement.node;
    }

    // Strategy 5: use the object itself as data
    if (!data) {
      data = nodeElement;
    }

    if (!data) return null;

    // Identify the node type — check multiple possible locations
    const type = data.type || nodeElement.type || null;
    const text = data.text || nodeElement.text || null;
    const file = data.file || nodeElement.file || nodeElement.filePath || null;
    const label = data.label || nodeElement.label || null;
    const url = data.url || nodeElement.url || null;

    switch (type) {
      case 'text':
        return text || null;

      case 'file':
        if (!this.settings.includeImages) {
          return null;
        }
        return file ? `[File: ${file}]` : null;

      case 'group':
        if (!this.settings.includeGroups) {
          return null;
        }
        return label ? `[Group: ${label}]` : null;

      case 'link':
        if (!this.settings.includeLinks) {
          return null;
        }
        return url ? `[Link: ${url}]` : null;

      default:
        // Fallback — return whatever text content is available
        return text || label || (file ? `[File: ${file}]` : null) || null;
    }
  }

  /**
   * Copy only the currently selected nodes on the canvas.
   */
  async copySelectedNodes(canvasView) {
    const selection = canvasView.canvas.selection;

    if (!selection || selection.size === 0) {
      new obsidian.Notice('Select nodes on the canvas first (Ctrl/Cmd + click).');
      return;
    }

    const contents = [];

    selection.forEach((nodeElement) => {
      const content = this.extractNodeContent(nodeElement);
      if (content) {
        contents.push(content);
      }
    });

    if (contents.length === 0) {
      new obsidian.Notice('Selected nodes have no text content (or their type is disabled in Settings).');
      return;
    }

    const finalText = this.formatOutput(contents);
    await navigator.clipboard.writeText(finalText);
    new obsidian.Notice(`✓ Copied ${contents.length} node(s) to clipboard`);
  }

  /**
   * Copy ALL nodes from the entire canvas.
   */
  async copyAllNodes(canvasView) {
    const nodes = canvasView.canvas.nodes;

    if (!nodes || nodes.size === 0) {
      new obsidian.Notice('Canvas is empty.');
      return;
    }

    const contents = [];

    nodes.forEach((nodeElement) => {
      const content = this.extractNodeContent(nodeElement);
      if (content) {
        contents.push(content);
      }
    });

    if (contents.length === 0) {
      new obsidian.Notice('No content to copy (check Settings).');
      return;
    }

    const finalText = this.formatOutput(contents);
    await navigator.clipboard.writeText(finalText);
    new obsidian.Notice(`✓ Copied ALL ${contents.length} node(s) to clipboard`);
  }

  /**
   * Format the array of node contents into a single string
   * based on the user's chosen format settings.
   */
  formatOutput(contents) {
    const sep = this.settings.separator || '---';
    const addLabels = this.settings.addNodeLabels;

    switch (this.settings.copyFormat) {
      case 'markdown':
        return contents
          .map((c, i) => {
            const label = addLabels ? `**Node ${i + 1}:**\n` : '';
            return `${label}\`\`\`\n${c}\n\`\`\``;
          })
          .join(`\n\n${sep}\n\n`);

      case 'numbered':
        return contents
          .map((c, i) => `${i + 1}. ${c}`)
          .join(`\n\n${sep}\n\n`);

      case 'bullets':
        return contents
          .map((c, i) => {
            const label = addLabels ? `**Node ${i + 1}:**\n` : '';
            const lines = c.split('\n').map((line) => `  ${line}`).join('\n');
            return `${label}- ${lines.trimStart()}`;
          })
          .join(`\n\n${sep}\n\n`);

      case 'plain':
      default:
        return contents
          .map((c, i) => {
            const label = addLabels ? `[Node ${i + 1}]\n` : '';
            return `${label}${c}`;
          })
          .join(`\n\n${sep}\n\n`);
    }
  }

  onunload() {
    console.log('Canvas Copy Selected: unloaded');
  }
}

module.exports = CanvasCopySelected;