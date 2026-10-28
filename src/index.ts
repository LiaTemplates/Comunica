// Browser side: renders the results of ./rdf.ts into the LiaScript code-blocks.
import { Network } from 'vis-network/standalone'
import * as rdf from './rdf.ts'

const escapeHtml = (value: string) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const STYLE = `
<style>
.rdf-table { width: 100%; border-collapse: collapse; font-family: Consolas, Monaco, monospace; font-size: 13px; background: #111; color: #eee; border: 1px solid #333; }
.rdf-table th { padding: 8px 10px; text-align: left; border: 1px solid #333; color: #9cdcfe; font-weight: 600; background: #1b1b1b; }
.rdf-table td { padding: 8px 10px; border: 1px solid #2a2a2a; vertical-align: top; word-break: break-all; }
.rdf-table tbody tr:nth-child(even) { background: #161616; }
.rdf-table tbody tr:hover { background: #222; }
.rdf-table .index { color: #888; }
.rdf-table a { color: #4fc1ff; text-decoration: none; }
.rdf-table a:hover { text-decoration: underline; color: #82e0ff; }
</style>`

function htmlTable(rows: object[]) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const cell = (value = '') =>
    /^(https?:\/\/|mailto:)/i.test(value)
      ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
      : escapeHtml(value)

  return `${STYLE}
<table class="rdf-table">
  <thead><tr><th>i</th>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>
  <tbody>${rows
    .map((row, i) => `<tr><td class="index">${i}</td>${columns.map((c) => `<td>${cell(row[c])}</td>`).join('')}</tr>`)
    .join('')}</tbody>
</table>`
}

const GROUPS = {
  NamedNode: { color: { background: '#cfe8fc', border: '#1f77b4' } },
  BlankNode: { color: { background: '#e0e0e0', border: '#888' } },
  Literal: { color: { background: '#fff3c4', border: '#c9a400' } },
}

// <rdf-graph data="{nodes, edges}"> draws the graph as soon as LiaScript puts it on the page
customElements.define(
  'rdf-graph',
  class extends HTMLElement {
    connectedCallback() {
      // 300px fits into the LiaScript console, GRAPH has more room
      this.style.cssText = `display:block; height:${this.getAttribute('height') || '300px'}; background:#fff; border-radius:4px`
      new Network(this, JSON.parse(this.getAttribute('data')), {
        groups: GROUPS,
        edges: { font: { size: 11, align: 'middle' }, smooth: { type: 'dynamic' } },
        physics: { barnesHut: { springLength: 160 } },
      })
    }
  },
)

const graphElement = (graph, height = '') =>
  `<rdf-graph data="${escapeHtml(JSON.stringify(graph))}" height="${escapeHtml(height)}"></rdf-graph>`

function run(send, console, blocks: number, job: () => Promise<any>) {
  job()
    .then((out) => {
      if (out.text !== undefined) return send.lia(out.text)

      console.html(
        out.rows
          ? out.rows.length
            ? htmlTable(out.rows)
            : 'no results'
          : graphElement(out.graph),
      )
      send.lia('LIA: stop')
    })
    .catch((error) => {
      const message = error?.message || String(error)
      const line = message.match(/line:?\s*(\d+)/i)
      // mark the line in the editor of the code-block that failed to parse
      const markers =
        line && error.block !== undefined
          ? Array.from({ length: blocks }, (_, i) =>
              i === error.block
                ? [{ row: parseInt(line[1]) - 1, column: 1, text: message, type: 'error' }]
                : [],
            )
          : []
      send.lia(message, markers, false)
    })
}

// LiaScript leaves an unused macro parameter as "@0"
const param = (value: string) => (value && !value.startsWith('@') ? value.trim() : undefined)

global.RDF = {
  query: (send, console, query: string, data?: string) =>
    run(send, console, data === undefined ? 1 : 2, () => rdf.query(query, data)),

  convert: (send, console, data: string, format?: string) =>
    run(send, console, 1, () => rdf.convert(data, param(format))),

  shacl: (send, console, data: string, shapes: string) =>
    run(send, console, 2, () => rdf.shacl(data, shapes)),

  // Only the graph, the code-block itself is not shown
  draw: (send, data: string) =>
    rdf
      .convert(data, 'graph')
      .then((out) => send.lia('HTML: ' + graphElement(out.graph, '400px')))
      .catch((error) =>
        send.lia(`HTML: <pre style="color:#c00">${escapeHtml(error?.message || String(error))}</pre>`),
      ),
}
