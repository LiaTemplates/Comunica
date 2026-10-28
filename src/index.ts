import { QueryEngine as SparqlEngine } from '@comunica/query-sparql'
import { QueryEngine as RdfjsEngine } from '@comunica/query-sparql-rdfjs'
import { Store as N3Store, Parser as N3Parser, Writer as N3Writer } from 'n3'

function format(query: string) {
  return query.match(/#\s*format:\s*(\S+)/)?.[1] || 'table'
}

function sources(query) {
  let result = []

  try {
    const matches = query.matchAll(/#\s*sources?:\s*([^\n]+)/g)

    for (const match of matches) {
      // `sparql@https://…` is Comunica's notation for a typed source
      result.push(
        match[1]
          .split(/\s+/)
          .filter(Boolean)
          .map((s) => {
            const typed = s.match(/^(\w+)@(https?:\/\/.+)$/)
            return typed ? { type: typed[1], value: typed[2] } : s
          }),
      )
    }
  } catch (e) {
    console.warn('SPARQL', e)
  }

  return result.flat()
}

global.RDF = {
  parse: {
    rdf: async function (code: string) {
      const parser = new N3Parser()
      const store = new N3Store()

      return new Promise((resolve, reject) => {
        parser.parse(code, (error, quad, prefixes) => {
          if (error) {
            reject(error)
          } else if (quad) {
            store.addQuad(quad)
          } else {
            // Parsing complete
            resolve(store)
          }
        })
      })
    },
  },

  query: async function (
    query: string,
    send: (ok: boolean, message: string) => void,
    store: any[],
  ) {
    try {
      // Separate RDF/JS stores from URL sources
      const rdfJsStores = store.filter((s) => s instanceof N3Store)
      const urlSources = sources(query)

      let engine: any
      let querySources: any[]

      if (rdfJsStores.length > 0 && urlSources.length === 0) {
        // Only RDF/JS stores - use RDF/JS engine
        engine = new RdfjsEngine()
        querySources = rdfJsStores
      } else {
        // URLs or mixed sources - use regular SPARQL engine
        engine = new SparqlEngine()
        querySources = store.concat(urlSources)
      }

      const result = await engine.query(query, {
        sources: querySources,
      })

      // SPARQL Update: nothing to serialize, so run it and show the changed data
      if (result.resultType === 'void') {
        await result.execute()
        send(
          true,
          rdfJsStores.length
            ? new N3Writer().quadsToString(rdfJsStores[0].getQuads())
            : 'OK',
        )
        return
      }

      const formatType = format(query)

      const { data } = await engine.resultToString(
        result,
        formatType === 'table' ? 'application/json' : formatType,
      )

      // Collect all data from the stream (browser-compatible)
      const chunks: any[] = []
      data.on('data', (chunk: any) => {
        chunks.push(chunk)
      })

      data.on('end', () => {
        // Convert chunks to string - handle both Buffer and Uint8Array
        let resultText = ''
        for (const chunk of chunks) {
          if (typeof chunk === 'string') {
            resultText += chunk
          } else if (chunk instanceof Uint8Array || chunk.buffer) {
            resultText += new TextDecoder().decode(chunk)
          } else {
            resultText += chunk.toString()
          }
        }

        if (formatType !== 'table') return send(true, resultText)

        // ASK returns a boolean, only bindings and quads become a table
        const json = JSON.parse(resultText)
        send(true, Array.isArray(json) ? json : String(json))
      })

      data.on('error', (error: Error) => {
        send(false, error.message)
      })
    } catch (e) {
      send(false, e.message)
    }
  },
}
