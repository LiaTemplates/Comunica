<!--
author:   André Dietrich

email:    LiaScript@web.de

version:  0.0.4

logo:     Screen-Shot-2012-09-28-at-20.27.12.png

language: en

narrator: US English Female

comment:  A macro library for trying and playing with SPARQL and RDF that is
          based on Comunica v5.

script:   dist/index.js

@onload
window.htmlTable = function (rows, opts = {}) {
  const {
    columns,
    caption,
    includeIndex = true,
    indexHeader = "i",
    linkify = true,
    urlRegex = /^(https?:\/\/|mailto:|ftp:\/\/)/i
  } = opts;

  const escapeHtml = (v) =>
    String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const allColumns = (() => {
    if (Array.isArray(columns) && columns.length) return columns.slice();
    const set = new Set();
    for (const r of rows || []) Object.keys(r || {}).forEach((k) => set.add(k));
    return Array.from(set);
  })();

  const formatCell = (value) => {
    if (value === null || value === undefined) return "";
    const raw = typeof value === "string" ? value : JSON.stringify(value);

    if (linkify && typeof raw === "string" && urlRegex.test(raw)) {
      const href = escapeHtml(raw);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`;
    }

    return escapeHtml(raw);
  };

  const ths = [
    includeIndex ? `<th>${escapeHtml(indexHeader)}</th>` : "",
    ...allColumns.map((c) => `<th>${escapeHtml(c)}</th>`)
  ].join("");

  const trs = (rows || []).map((r, i) => {
    const tds = [
      includeIndex ? `<td class="index">${i}</td>` : "",
      ...allColumns.map((c) => `<td>${formatCell(r?.[c])}</td>`)
    ].join("");
    return `<tr>${tds}</tr>`;
  }).join("");

  const cap = caption ? `<caption>${escapeHtml(caption)}</caption>` : "";

  return `
<style>
.html-console-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  background: #111;
  color: #eee;
  border: 1px solid #333;
}

/* Caption */
.html-console-table caption {
  caption-side: top;
  text-align: left;
  padding: 10px;
  font-weight: bold;
  color: #fff;
}

/* Header */
.html-console-table thead {
  background: #1b1b1b;
}

.html-console-table th {
  padding: 8px 10px;
  text-align: left;
  border: 1px solid #333;   /* vertical + horizontal lines */
  color: #9cdcfe;
  font-weight: 600;
}

/* Body cells */
.html-console-table td {
  padding: 8px 10px;
  border: 1px solid #2a2a2a;  /* full grid */
  vertical-align: top;
  word-break: break-all;
}

/* Zebra rows */
.html-console-table tbody tr:nth-child(even) {
  background: #161616;
}

/* Hover */
.html-console-table tbody tr:hover {
  background: #222;
}

/* Index column */
.html-console-table .index {
  color: #888;
}

/* Links */
.html-console-table a {
  color: #4fc1ff;
  text-decoration: none;
  word-break: break-all;
}

.html-console-table a:hover {
  text-decoration: underline;
  color: #82e0ff;
}
</style>

<table class="html-console-table">
  ${cap}
  <thead><tr>${ths}</tr></thead>
  <tbody>${trs}</tbody>
</table>
`.trim();
}
@end

@Comunica.SPARQL
<script>
  function output(ok, message) {
    if (!ok) send.lia(message, [], false)
    else if (typeof message === 'string') send.lia(message)
    else {
      console.html(htmlTable(message))
      send.lia("LIA: stop")
    }
  }

  window.RDF.query(`@'input`, output, [])

  "LIA: wait"
</script>
@end

@Comunica.RDF_SPARQL
<script>
  function output(ok, message) {
    if (!ok) send.lia(message, [], false)
    else if (typeof message === 'string') send.lia(message)
    else {
      console.html(htmlTable(message))
      send.lia("LIA: stop")
    }
  }

  window.RDF.parse.rdf(`@'input(0)`).then((store) => {
    window.RDF.query(`@'input(1)`, output, [store])
  }).catch((error) => {
    const message = error.message || error.toString()
    const line = message.match(/on line (\d+)/)
    // mark the line in the first (Turtle) editor
    send.lia(message, line ? [[{
      row: parseInt(line[1]) - 1,
      column: 1,
      text: message,
      type: "error"
    }], []] : [], false)
  })

  "LIA: wait"
</script>
@end

-->

# Comunica - Template

                          --{{0}}--
This document defines some basic [LiaScript](https://LiaScript.github.io)-macros
for dealing and experimenting with the semantic web-technologies, such as
querying [SPARQL](https://en.wikipedia.org/wiki/SPARQL) and or dealing with
[RDF](https://en.wikipedia.org/wiki/Resource_Description_Framework) in the form
of [turtle](https://en.wikipedia.org/wiki/Turtle_%28syntax%29). Others are about
to come. This template is mainly based on [Comunica](https://comunica.dev) an
open-source knowledge graph querying framework. I hope in the future, there will
be more functions available. At the moment it is possible to execute and edit
code-blocks with SPARQL queries.

__Try it on LiaScript:__

https://liascript.github.io/course/?https://raw.githubusercontent.com/liaTemplates/Comunica/main/README.md

__See the project on Github:__

https://github.com/liaTemplates/Comunica

                         --{{1}}--
There are three ways to use this template. The easiest way is to use the
`import` statement and the url of the raw text-file of the master branch or any
other branch or version. But you can also copy the required functionality
directly into the header of your Markdown document, see therefor the
[last slide](#implementation). And of course, you could also clone this project
and change it, as you wish.

                           {{1}}
1. Load the macros via

   `import: https://raw.githubusercontent.com/LiaTemplates/Comunica/0.0.4/README.md`

2. Copy the definitions into your Project

3. Clone this repository on GitHub

## Minimal Requirements

                         --{{0}}--
What is actually needed to make your Markdown code-snippets with
[SPARQL](https://en.wikipedia.org/wiki/SPARQL) executable and editable? Not
much, simply add the following comment to the head of your Markdown document.

``` markdown
<!--
import: https://raw.githubusercontent.com/LiaTemplates/Comunica/0.0.4/README.md
-->

# Title

...
```

                         --{{1}}--
And finally attach the macros/functions, which are defined by this document, to
the end of a code-block. You can define as much code-blocks as you want.


                           {{1}}
```` markdown
``` sparql
# source: https://fragments.dbpedia.org/2015/en

SELECT ?s ?p ?o WHERE {
  ?s ?p <http://dbpedia.org/resource/Ukraine>.
  ?s ?p ?o
} LIMIT 100
```
@Comunica.SPARQL
````


## Macros

                          --{{0}}--
Currently you can use two macros, which can also be tweaked a bit. We will
describe them both within this section.

1. `@Comunica.SPARQL`
2. `@Comunica.RDF_SPARQL`


### `@Comunica.SPARQL`

                          --{{0}}--
Add the macro `@Comunica.SPARQL` to the end of your
[SPARQL](https://en.wikipedia.org/wiki/SPARQL) query to make it executable and
editable. You can add as much blocks as you want to.

```` markdown
``` sparql
# source: https://fragments.dbpedia.org/2015/en

SELECT ?s ?p ?o WHERE {
  ?s ?p <http://dbpedia.org/resource/Ukraine>.
  ?s ?p ?o
} LIMIT 10
```
@Comunica.SPARQL
````

                          --{{1}}--
The result will look as follows, you can execute it, change the code of the
query and go back and forth between your version.

                            {{1}}
``` sparql
# source: https://fragments.dbpedia.org/2015/en

SELECT ?s ?p ?o WHERE {
  ?s ?p <http://dbpedia.org/resource/Ukraine>.
  ?s ?p ?o
} LIMIT 10
```
@Comunica.SPARQL


                          --{{2}}--
And to some extend also the errors are propagated to the user.

                            {{2}}
``` sparql
# source: https://fragments.dbpedia.org/2015/en

SELECT ?s ?p ?o WHERE {
  ?s ?p <http://dbpedia.org/resource/Ukraine>
  ?s ?p ?o
} LIMIT 10
```
@Comunica.SPARQL

#### Sources

                          --{{0}}--
As you have seen earlier, it is possible by you and by your user to define the
sources for your query. Simply add one or multiple comments of the following
form into your code-block. If you use a one-liner, your sources have to be
separated by spaces.

``` sparql
# source: https://fragments.dbpedia.org/2015/en
# source: https://www.rubensworks.net https://ruben.verborgh.org/profile/

SELECT ?s ?p ?o WHERE {
?s ?p <http://dbpedia.org/resource/Belgium>.
?s ?p ?o
} LIMIT 100
```
@Comunica.SPARQL

                          --{{1}}--
Comunica guesses the type of a source. If it guesses wrong, put the type in
front of the URL, like `sparql@` for a SPARQL endpoint. All types are listed in
the [Comunica documentation](https://comunica.dev/docs/query/advanced/source_types/).

                            {{1}}
``` sparql
# source: sparql@https://query.wikidata.org/sparql

SELECT ?cat WHERE {
  ?cat <http://www.wikidata.org/prop/direct/P31> <http://www.wikidata.org/entity/Q146>
} LIMIT 5
```
@Comunica.SPARQL


#### Formats

                          --{{0}}--
It is possible to define different output formats, simply by adding an comment
of the form `# format: _`.

``` sparql
# format: table
# source: https://fragments.dbpedia.org/2015/en

SELECT ?s ?p ?o WHERE {
?s ?p <http://dbpedia.org/resource/Ukraine>.
?s ?p ?o
} LIMIT 5
```
@Comunica.SPARQL

                          --{{1}}--
The default format is currently `table`, however, you can overwrite this by one
of the following media types. All possible formats are defined
[here](https://comunica.dev/docs/query/advanced/result_formats/). The RDF
serializations (TriG, Turtle, JSON-LD, …) only work for `CONSTRUCT` and
`DESCRIBE` queries, the results formats only for `SELECT` and `ASK`.

                            {{1}}
| Media type                        | Supported | Description                                                                      |
| --------------------------------- |:---------:| -------------------------------------------------------------------------------- |
| `application/json`                |    ✅     | A custom, simplified JSON result format.                                         |
| `simple`                          |    ✅     | A custom, text-based result format.                                              |
| `application/sparql-results+json` |    ✅     | The [SPARQL/JSON](https://www.w3.org/TR/sparql11-results-json) results format.   |
| `application/sparql-results+xml`  |    ✅     | The [SPARQL/XML](https://www.w3.org/TR/rdf-sparql-XMLres) results format.        |
| `text/csv`                        |    ✅     | The [SPARQL/CSV](https://www.w3.org/TR/sparql11-results-csv-tsv) results format. |
| `text/tab-separated-values`       |    ✅     | The [SPARQL/TSV](https://www.w3.org/TR/sparql11-results-csv-tsv) results format. |
| `stats`                           |    ❌     | A custom results format for testing and debugging.                               |
| `table`                           |    ✅     | An HTML table, the default of this template.                                     |
| `tree`                            |    ✅     | A tree-based result format for GraphQL-LD result compacting.                     |
| `application/trig`                |    ✅     | The [TriG](https://www.w3.org/TR/trig) RDF serialization.                        |
| `application/n-quads`             |    ✅     | The [N-Quads](https://www.w3.org/TR/n-quads) RDF serialization.                  |
| `text/turtle`                     |    ✅     | The [Turtle](https://www.w3.org/TR/turtle) RDF serialization.                    |
| `application/n-triples`           |    ✅     | The [N-Triples](https://www.w3.org/TR/n-triples) RDF serialization.              |
| `text/n3`                         |    ✅     | The [Notation3](https://www.w3.org/TeamSubmission/n3) serialization.             |
| `application/ld+json`             |    ✅     | The [JSON-LD](https://json-ld.org) RDF serialization.                            |


### `@Comunica.RDF_SPARQL`

                          --{{0}}--
It is possible also to define your own files and to query them, by combining two
Markdown-blocks in conjunction. The first contains your turtle file, while the
second code-block contains your query.

```` markdown
``` turtle       Turtle
@prefix :     <http://www.example.org/sample.rdfs#> .
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

:Dog      rdfs:subClassOf :Animal.
:Person   rdfs:subClassOf :Animal.

:hasChild rdfs:range :Animal;
          rdfs:domain :Animal.
:hasSon   rdfs:subPropertyOf :hasChild.

:Max      a :Dog.
:Abel     a :Person.
:Adam     a :Person;
            :hasSon :Abel.
```
``` sparql      -SPARQL-Query
SELECT * {
  ?s ?p ?o
} LIMIT 5
```
@Comunica.RDF_SPARQL
````

                          --{{1}}--
The text behind the language definition is used as a title for your code-block,
whereby a starting `+` or `-` define, whether the editor view should be opened
or closed.

                            {{1}}
``` turtle       Turtle
@prefix :     <http://www.example.org/sample.rdfs#> .
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

:Dog      rdfs:subClassOf :Animal.
:Person   rdfs:subClassOf :Animal.

:hasChild rdfs:range :Animal;
          rdfs:domain :Animal.
:hasSon   rdfs:subPropertyOf :hasChild.

:Max      a :Dog.
:Abel     a :Person.
:Adam     a :Person;
            :hasSon :Abel.
```
``` sparql      -SPARQL-Query
# format: simple
# source: https://fragments.dbpedia.org/2015/en

SELECT * {
  ?s ?p ?o
} LIMIT 5
```
@Comunica.RDF_SPARQL


                          --{{2}}--
It is still possible to add different sources or to change the output format, as
described before.

#### SPARQL Update

                          --{{0}}--
`INSERT` and `DELETE` change the data of the first code-block. The result shows
all triples after the update. Every run starts again from the original data.

``` turtle       Turtle
@prefix : <http://www.example.org/sample.rdfs#> .

:Max a :Dog .
```
``` sparql      +SPARQL-Update
PREFIX : <http://www.example.org/sample.rdfs#>

INSERT DATA { :Bello a :Dog }
```
@Comunica.RDF_SPARQL

## Implementation

                          --{{0}}--
All the functionality is defined within the main-comment at the top of
[this document](https://github.com/LiaTemplates/Comunica/blob/main/README.md?plain=1).
It makes use of the typescript-functions defined in `src/index.ts`, which defines
a global object `window.RDF`. Copy the `script` line, the `@onload` block and both
macros into the header of your course.

                          --{{1}}--
If you want to build this project by your own, then follow the following
instructions:

                            {{1}}
``` bash
$ git clone https://github.com/LiaTemplates/Comunica

$ cd Comunica

$ git checkout dev

$ npm i

$ npm run build
```
