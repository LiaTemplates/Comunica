// Everything that does not need a browser, so it can be tested with `npm test`.
import { QueryEngine as SparqlEngine } from '@comunica/query-sparql'
import { QueryEngine as RdfjsEngine } from '@comunica/query-sparql-rdfjs'
import { DataFactory, Parser, Reasoner, Store, Writer } from 'n3'
import { JsonLdParser } from 'jsonld-streaming-parser'
import { RdfXmlParser } from 'rdfxml-streaming-parser'
import { JsonLdSerializer } from 'jsonld-streaming-serializer'
import Validator from 'shacl-engine/Validator.js'

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const XSD = 'http://www.w3.org/2001/XMLSchema#'

const KNOWN_PREFIXES = {
  rdf: RDF,
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  xsd: XSD,
  sh: 'http://www.w3.org/ns/shacl#',
}

const RDFS_RULES = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
{ ?p rdfs:domain ?c . ?x ?p ?y } => { ?x a ?c } .
{ ?p rdfs:range ?c . ?x ?p ?y } => { ?y a ?c } .
{ ?p rdfs:subPropertyOf ?q . ?q rdfs:subPropertyOf ?r } => { ?p rdfs:subPropertyOf ?r } .
{ ?p rdfs:subPropertyOf ?q . ?x ?p ?y } => { ?x ?q ?y } .
{ ?c rdfs:subClassOf ?d . ?d rdfs:subClassOf ?e } => { ?c rdfs:subClassOf ?e } .
{ ?c rdfs:subClassOf ?d . ?x a ?c } => { ?x a ?d } .
`

// shortcut: a small part of OWL RL, enough for teaching; use a real OWL reasoner for full OWL
const OWL_RULES = `
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
{ ?p owl:inverseOf ?q . ?x ?p ?y } => { ?y ?q ?x } .
{ ?p owl:inverseOf ?q . ?x ?q ?y } => { ?y ?p ?x } .
{ ?p a owl:SymmetricProperty . ?x ?p ?y } => { ?y ?p ?x } .
{ ?p a owl:TransitiveProperty . ?x ?p ?y . ?y ?p ?z } => { ?x ?p ?z } .
{ ?c owl:equivalentClass ?d } => { ?c rdfs:subClassOf ?d . ?d rdfs:subClassOf ?c } .
{ ?p owl:equivalentProperty ?q } => { ?p rdfs:subPropertyOf ?q . ?q rdfs:subPropertyOf ?p } .
{ ?x owl:sameAs ?y } => { ?y owl:sameAs ?x } .
{ ?x owl:sameAs ?y . ?x ?p ?o } => { ?y ?p ?o } .
`

const RULES = { rdfs: RDFS_RULES, owl: RDFS_RULES + OWL_RULES }

// Formats this file writes itself, everything else is passed on to Comunica
const N3_FORMATS = [
  'text/turtle',
  'application/trig',
  'application/n-triples',
  'application/n-quads',
  'text/n3',
]
const OWN_FORMATS = ['table', 'graph', 'application/ld+json', ...N3_FORMATS]

type Output = { text?: string; rows?: object[]; graph?: { nodes: object[]; edges: object[] } }

/** Reads a `# name: value` comment */
export function option(text: string, name: string) {
  return text.match(new RegExp(`#[ \\t]*${name}:[ \\t]*(\\S+)`))?.[1]
}

export function sources(query: string) {
  return [...query.matchAll(/#[ \t]*sources?:[ \t]*([^\n]+)/g)].flatMap((match) =>
    match[1]
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => {
        // `sparql@https://…` is Comunica's notation for a typed source
        const typed = s.match(/^(\w+)@(https?:\/\/.+)$/)
        return typed ? { type: typed[1], value: typed[2] } : s
      }),
  )
}

/** Turtle, TriG, N-Triples, N-Quads, JSON-LD or RDF/XML, guessed from the first character */
export async function parse(text: string) {
  const start = text.trim()
  const baseIRI = 'http://example.org/'

  if (start.startsWith('{') || start.startsWith('['))
    return streamParse(new JsonLdParser({ baseIRI }), text)
  if (start.startsWith('<?xml') || start.startsWith('<rdf:RDF'))
    return streamParse(new RdfXmlParser({ baseIRI }), text)

  const prefixes = {}
  const quads = new Parser().parse(text, null, (prefix, iri) => {
    prefixes[prefix] = iri.value
  })
  return { store: new Store(quads), prefixes }
}

function streamParse(parser, text: string): Promise<{ store: Store; prefixes: object }> {
  const store = new Store()
  const prefixes = {}
  return new Promise((resolve, reject) => {
    parser
      .on('data', (quad) => store.addQuad(quad))
      // JSON-LD: namespace-like entries of the @context become prefixes
      .on('context', (context) =>
        [context].flat().forEach((c) =>
          Object.entries(c && typeof c === 'object' ? c : {}).forEach(([key, value]) => {
            if (typeof value === 'string' && /[/#]$/.test(value)) prefixes[key] = value
          }),
        ),
      )
      .on('error', reject)
      .on('end', () => resolve({ store, prefixes }))
    parser.write(text)
    parser.end()
  })
}

/** Adds all triples that follow from the RDFS or OWL rules */
export function reason(store: Store, mode?: string) {
  if (!mode) return
  const rules = RULES[mode.toLowerCase()]
  if (!rules) throw new Error(`Unknown reasoning "${mode}", use rdfs or owl`)
  new Reasoner(store).reason(new Store(new Parser({ format: 'text/n3' }).parse(rules)))
}

/** Parses a code block, applies its `# reasoning:` and remembers the block for error markers */
async function load(text: string, block: number, reasoning?: string) {
  try {
    const data = await parse(text)
    reason(data.store, reasoning || option(text, 'reasoning'))
    return data
  } catch (e) {
    e.block = block
    throw e
  }
}

export async function query(queryText: string, dataText?: string): Promise<Output> {
  const format = option(queryText, 'format') || 'table'
  const local =
    dataText === undefined ? undefined : await load(dataText, 0, option(queryText, 'reasoning'))
  const prefixes = local?.prefixes || {}
  const urls = sources(queryText)

  const engine = local && urls.length === 0 ? new RdfjsEngine() : new SparqlEngine()
  const result = await engine
    .query(queryText, { sources: [...(local ? [local.store] : []), ...urls] })
    .catch((e) => {
      e.block = local ? 1 : 0 // the query is the last code-block
      throw e
    })

  switch (result.resultType) {
    case 'void':
      // SPARQL Update: show the changed data
      await result.execute()
      return local ? render(local.store.getQuads(null, null, null, null), format, prefixes) : { text: 'OK' }

    case 'boolean':
      return { text: String(await result.execute()) }

    case 'quads':
      if (OWN_FORMATS.includes(format))
        return render(await (await result.execute()).toArray(), format, prefixes)
      break

    case 'bindings':
      if (format === 'table') {
        const bindings = await (await result.execute()).toArray()
        return {
          rows: bindings.map((b) =>
            Object.fromEntries([...b].map(([v, t]) => [v.value, show(t, prefixes)])),
          ),
        }
      }
  }

  const { data } = await engine.resultToString(result, format)
  let text = ''
  for await (const chunk of data)
    text += typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)
  return { text }
}

/** Shows the data of a single code block in another format */
export async function convert(dataText: string, format = 'table') {
  const { store, prefixes } = await load(dataText, 0)
  return render(store.getQuads(null, null, null, null), format, prefixes)
}

export async function shacl(dataText: string, shapesText: string): Promise<Output> {
  const data = await load(dataText, 0)
  const shapes = await load(shapesText, 1)
  const prefixes = { ...shapes.prefixes, ...data.prefixes }

  const factory = { ...DataFactory, dataset: (quads?) => new Store(quads) }
  const report = await new Validator(shapes.store, { factory }).validate({ dataset: data.store })

  if (report.conforms) return { text: 'conforms: true' }

  return {
    rows: report.results.map((r) => ({
      focusNode: show(r.focusNode?.term, prefixes),
      path: (r.path || []).flatMap((step) => step.predicates.map((p) => show(p, prefixes))).join('/'),
      severity: show(r.severity, prefixes),
      constraint: show(r.constraintComponent, prefixes),
      value: r.value ? show(r.value.term, prefixes) : '',
      message: (r.message || []).map((m) => m.value).join(' '),
    })),
  }
}

async function render(quads, format: string, prefixes: object): Promise<Output> {
  if (format === 'table')
    return {
      rows: quads.map((q) => ({
        subject: show(q.subject, prefixes),
        predicate: show(q.predicate, prefixes),
        object: show(q.object, prefixes),
        ...(q.graph.termType === 'DefaultGraph' ? {} : { graph: show(q.graph, prefixes) }),
      })),
    }

  if (format === 'graph') return { graph: graph(quads, prefixes) }

  if (format === 'application/ld+json') {
    // JSON-LD has no empty prefix
    const context = Object.fromEntries(Object.entries(prefixes).filter(([p]) => p))
    const serializer = new JsonLdSerializer({ space: '  ', context })
    const done = collect(serializer)
    quads.forEach((q) => serializer.write(q))
    serializer.end()
    return { text: await done }
  }

  if (N3_FORMATS.includes(format))
    return new Promise((resolve, reject) => {
      const writer = new Writer({ format, prefixes })
      writer.addQuads(quads)
      writer.end((error, text) => (error ? reject(error) : resolve({ text })))
    })

  throw new Error(`Unsupported format "${format}", use one of: ${OWN_FORMATS.join(', ')}`)
}

function collect(stream): Promise<string> {
  let text = ''
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => (text += chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(text))
  })
}

/** Nodes and edges for vis-network, literals get a node of their own per triple */
export function graph(quads, prefixes: object = {}) {
  const nodes = new Map()
  const edges = []

  const node = (term, id = term.termType + term.value) => {
    if (!nodes.has(id))
      nodes.set(id, {
        id,
        group: term.termType,
        // blank nodes are anonymous, their generated ids would only confuse
        ...(term.termType === 'BlankNode'
          ? { shape: 'dot', size: 8 }
          : { label: show(term, prefixes), shape: term.termType === 'Literal' ? 'box' : 'ellipse' }),
      })
    return id
  }

  quads.forEach((q, i) => {
    edges.push({
      from: node(q.subject),
      to: q.object.termType === 'Literal' ? node(q.object, `literal${i}`) : node(q.object),
      label: q.predicate.value === RDF + 'type' ? 'a' : show(q.predicate, prefixes),
      arrows: 'to',
    })
  })

  return { nodes: [...nodes.values()], edges }
}

/** A term as short text: prefixed name, "literal"@lang, "1"^^xsd:int or _:blank */
export function show(term, prefixes: object = {}): string {
  if (!term) return ''
  if (term.termType === 'BlankNode') return '_:' + term.value
  if (term.termType === 'Literal') {
    if (term.language) return `"${term.value}"@${term.language}`
    if (term.datatype.value === XSD + 'string') return `"${term.value}"`
    return `"${term.value}"^^${show(term.datatype, prefixes)}`
  }

  for (const [prefix, iri] of Object.entries({ ...KNOWN_PREFIXES, ...prefixes }))
    if (term.value.startsWith(iri) && /^[\w-]*$/.test(term.value.slice(iri.length)))
      return `${prefix}:${term.value.slice(iri.length)}`
  return term.value
}
