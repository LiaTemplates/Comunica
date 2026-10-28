import { test } from 'node:test'
import assert from 'node:assert/strict'
import { convert, graph, parse, query, shacl, sources } from './rdf.ts'

const TURTLE = `
@prefix :     <http://example.org/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:  <http://www.w3.org/2002/07/owl#> .

:Dog      rdfs:subClassOf :Animal .
:hasChild rdfs:range :Animal .
:hasSon   rdfs:subPropertyOf :hasChild ; owl:inverseOf :hasParent .
:Max      a :Dog ; :name "Max \\"the dog\\"" .
:Adam     :hasSon :Abel .
`

const animals = async (comment: string) =>
  (await query(`${comment}\nSELECT ?x { ?x a <http://example.org/Animal> }`, TURTLE)).rows
    .map((r) => r['x'])
    .sort()

test('sources', () => {
  assert.deepEqual(sources('# source: a  sparql@https://q.org/sparql\n# sources: b'), [
    'a',
    { type: 'sparql', value: 'https://q.org/sparql' },
    'b',
  ])
})

test('parses Turtle, JSON-LD and RDF/XML', async () => {
  assert.equal((await parse(TURTLE)).store.size, 7)
  assert.equal((await parse('{"@id": "http://a", "http://b": "c"}')).store.size, 1)
  const jsonld = await parse('{"@context": {"ex": "http://example.org/"}, "@id": "ex:a", "ex:b": "c"}')
  assert.deepEqual(jsonld.prefixes, { ex: 'http://example.org/' })
  const xml = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:ex="http://example.org/">
  <rdf:Description rdf:about="http://example.org/Max"><ex:name>Max</ex:name></rdf:Description>
</rdf:RDF>`
  assert.equal((await parse(xml)).store.size, 1)
})

test('Turtle errors carry block and line', async () => {
  await assert.rejects(query('SELECT * {?s ?p ?o}', ':a :b "x"\n:c :d :e .'), (e: any) => {
    assert.equal(e.block, 0)
    assert.match(e.message, /line \d/)
    return true
  })
})

test('SPARQL errors carry block and line', async () => {
  await assert.rejects(query('SELECT * {\n  ?s ?p ?o\n  ?x }', TURTLE), (e: any) => {
    assert.equal(e.block, 1)
    assert.match(e.message, /line 3/)
    return true
  })
})

test('reasoning', async () => {
  assert.deepEqual(await animals(''), [])
  assert.deepEqual(await animals('# reasoning:\n'), [])
  assert.deepEqual(await animals('# reasoning: rdfs'), [':Abel', ':Max'])
  const parents = await query('# reasoning: owl\nSELECT ?p { <http://example.org/Abel> <http://example.org/hasParent> ?p }', TURTLE)
  assert.deepEqual(parents.rows, [{ p: ':Adam' }])
})

test('ASK, UPDATE, CONSTRUCT', async () => {
  assert.deepEqual(await query('ASK { ?s ?p ?o }', TURTLE), { text: 'true' })
  const updated = await query('# format: text/turtle\nINSERT DATA { <http://example.org/Bello> a <http://example.org/Dog> }', TURTLE)
  assert.match(updated.text, /:Bello a :Dog/)
  const turtle = await query('# format: text/turtle\nCONSTRUCT WHERE { ?s a ?o }', TURTLE)
  assert.match(turtle.text, /@prefix : <http:\/\/example.org\/>/)
  const csv = await query('# format: text/csv\nSELECT ?s { ?s a ?o }', TURTLE)
  assert.match(csv.text, /^s\r?\n/)
})

test('convert', async () => {
  assert.equal((await convert(TURTLE)).rows.length, 7)
  assert.match((await convert(TURTLE, 'application/ld+json')).text, /"@id"/)
  assert.match((await convert(TURTLE, 'application/n-triples')).text, /<http:\/\/example.org\/Max>/)
  await assert.rejects(convert(TURTLE, 'application/rdf+xml'), /Unsupported format/)
})

test('graph', async () => {
  const { store } = await parse('@prefix : <http://example.org/> .\n:a :b "x", "y" ; :c :d .')
  const g = graph(store.getQuads(null, null, null, null))
  assert.equal(g.edges.length, 3)
  assert.equal(g.nodes.length, 4) // :a, :d and one node per literal
})

test('SHACL', async () => {
  const shapes = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix :   <http://example.org/> .
:DogShape a sh:NodeShape ; sh:targetClass :Dog ;
  sh:property [ sh:path :age ; sh:minCount 1 ; sh:message "Every dog needs an age" ] .`
  const report = await shacl(TURTLE, shapes)
  assert.equal(report.rows.length, 1)
  assert.equal(report.rows[0]['focusNode'], ':Max')
  assert.equal(report.rows[0]['message'], 'Every dog needs an age')
  assert.deepEqual(await shacl(TURTLE + ':Max :age 3 .', shapes), { text: 'conforms: true' })
})
