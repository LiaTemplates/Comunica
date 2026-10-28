<!--
author:   André Dietrich

email:    LiaScript@web.de

version:  0.0.5

logo:     Screen-Shot-2012-09-28-at-20.27.12.png

language: en

narrator: US English Female

comment:  A macro library for trying and playing with SPARQL, RDF, reasoning and
          SHACL, based on Comunica v5.

script:   dist/index.js

@Comunica.SPARQL
<script>
  window.RDF.query(send, console, `@'input`)
  "LIA: wait"
</script>
@end

@Comunica.RDF_SPARQL
<script>
  window.RDF.query(send, console, `@'input(1)`, `@'input(0)`)
  "LIA: wait"
</script>
@end

@Comunica.RDF
<script>
  window.RDF.convert(send, console, `@'input`, "@0")
  "LIA: wait"
</script>
@end

@Comunica.SHACL
<script>
  window.RDF.shacl(send, console, `@'input(0)`, `@'input(1)`)
  "LIA: wait"
</script>
@end

@Comunica.GRAPH
<script run-once modify="false" style="display:block">
  // runs on page load, maybe before dist/index.js is ready
  (function draw() {
    window.RDF ? window.RDF.draw(send, `@'0`) : setTimeout(draw, 100)
  })()
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
of [turtle](https://en.wikipedia.org/wiki/Turtle_%28syntax%29), JSON-LD or RDF/XML.
This template is mainly based on [Comunica](https://comunica.dev) an
open-source knowledge graph querying framework. You can execute and edit
SPARQL queries, convert and draw RDF data, use RDFS and OWL reasoning and
validate data with SHACL.

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

   `import: https://raw.githubusercontent.com/LiaTemplates/Comunica/0.0.5/README.md`

2. Copy the definitions into your Project

3. Clone this repository on GitHub

## Minimal Requirements

                         --{{0}}--
What is actually needed to make your Markdown code-snippets with
[SPARQL](https://en.wikipedia.org/wiki/SPARQL) executable and editable? Not
much, simply add the following comment to the head of your Markdown document.

``` markdown
<!--
import: https://raw.githubusercontent.com/LiaTemplates/Comunica/0.0.5/README.md
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
Currently you can use five macros, which can also be tweaked a bit. We will
describe them all within this section.

1. `@Comunica.SPARQL`
2. `@Comunica.RDF_SPARQL`
3. `@Comunica.RDF`
4. `@Comunica.GRAPH`
5. `@Comunica.SHACL`


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
| `graph`                           |    ✅     | An interactive graph of the result, only for `CONSTRUCT` and `DESCRIBE`.          |
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

#### Reasoning

                          --{{0}}--
Add `# reasoning: rdfs` to the query or to the data and all triples that follow
from the RDFS rules are added before the query runs: `rdfs:subClassOf`,
`rdfs:subPropertyOf`, `rdfs:domain` and `rdfs:range`. With `# reasoning: owl`
you additionally get a small part of OWL: `owl:inverseOf`, `owl:sameAs`,
`owl:equivalentClass`, `owl:equivalentProperty`, `owl:SymmetricProperty` and
`owl:TransitiveProperty`. Remove the comment and compare the results.

``` turtle       Turtle
@prefix :     <http://www.example.org/sample.rdfs#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .

:Dog      rdfs:subClassOf :Animal .
:Person   rdfs:subClassOf :Animal .
:hasSon   rdfs:subPropertyOf :hasChild ;
          owl:inverseOf :hasParent .
:hasChild rdfs:range :Person .

:Max      a :Dog .
:Adam     :hasSon :Abel .
```
``` sparql      +SPARQL-Query
# reasoning: owl
PREFIX : <http://www.example.org/sample.rdfs#>

SELECT ?animal ?parent {
  ?animal a :Animal .
  OPTIONAL { ?animal :hasParent ?parent }
}
```
@Comunica.RDF_SPARQL

### `@Comunica.RDF`

                          --{{0}}--
Attach `@Comunica.RDF` to a single code-block with RDF data to check it and to
see it in another format. The data can be written in Turtle, TriG, N-Triples,
N-Quads, JSON-LD or RDF/XML, the format is detected automatically. Without a
parameter the triples are shown as a table.

``` turtle
@prefix : <http://www.example.org/sample.rdfs#> .

:Max a :Dog ;
     :name "Max" ;
     :knows :Bello .
```
@Comunica.RDF

                          --{{1}}--
Put the output format in brackets: `text/turtle`, `application/trig`,
`application/n-triples`, `application/n-quads`, `text/n3`,
`application/ld+json`, `table` or `graph`.

                            {{1}}
``` json
{
  "@context": { "ex": "http://www.example.org/sample.rdfs#" },
  "@id": "ex:Max",
  "@type": "ex:Dog",
  "ex:name": "Max",
  "ex:knows": { "@id": "ex:Bello" }
}
```
@Comunica.RDF(text/turtle)

#### Graph

                          --{{0}}--
`graph` draws the data, you can move the nodes around and zoom in. Literals
are yellow boxes, blank nodes are small grey dots. The same works for `CONSTRUCT` queries
with `# format: graph`. A `# reasoning:` comment also works here.

``` turtle
@prefix :     <http://www.example.org/sample.rdfs#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
# reasoning: rdfs

:Dog  rdfs:subClassOf :Animal .
:Max  a :Dog ;
      :name "Max" ;
      :knows [ :name "Bello" ] .
```
@Comunica.RDF(graph)

### `@Comunica.GRAPH`

                          --{{0}}--
If you only want to show the graph, put `@Comunica.GRAPH` directly behind the
backticks. The code-block is replaced by the drawing, there is no editor. All
input formats and `# reasoning:` work as before.

```` markdown
``` turtle @Comunica.GRAPH
@prefix :     <http://www.example.org/sample.rdfs#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
# reasoning: rdfs

:Dog  rdfs:subClassOf :Animal .
:Max  a :Dog ;
      :name "Max" ;
      :knows [ :name "Bello" ] .
```
````

                          --{{1}}--
This is the result:

                            {{1}}
``` turtle @Comunica.GRAPH
@prefix :     <http://www.example.org/sample.rdfs#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
# reasoning: rdfs

:Dog  rdfs:subClassOf :Animal .
:Max  a :Dog ;
      :name "Max" ;
      :knows [ :name "Bello" ] .
```

### `@Comunica.SHACL`

                          --{{0}}--
[SHACL](https://www.w3.org/TR/shacl/) checks whether data matches a set of
shapes. The first code-block contains the data, the second one the shapes. If
everything is fine, the result is `conforms: true`, otherwise you get a table
with all violations.

``` turtle       Data
@prefix :    <http://www.example.org/sample.rdfs#> .

:Max   a :Dog ; :name "Max" ; :age "three" .
:Bello a :Dog .
```
``` turtle       +Shapes
@prefix sh:  <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix :    <http://www.example.org/sample.rdfs#> .

:DogShape a sh:NodeShape ;
  sh:targetClass :Dog ;
  sh:property [
    sh:path     :name ;
    sh:minCount 1 ;
    sh:message  "Every dog needs a name"
  ] ;
  sh:property [
    sh:path     :age ;
    sh:datatype xsd:integer
  ] .
```
@Comunica.SHACL

                          --{{1}}--
The SHACL core constraints are supported, SPARQL-based constraints are not.

## Implementation

                          --{{0}}--
All the functionality is defined within the main-comment at the top of
[this document](https://github.com/LiaTemplates/Comunica/blob/main/README.md?plain=1).
It makes use of the typescript-functions defined in `src/index.ts`, which defines
a global object `window.RDF` (the logic lives in `src/rdf.ts`). Copy the `script`
line and the macros into the header of your course.

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

$ npm test
```
