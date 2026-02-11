import { QueryEngine as SparqlEngine } from '@comunica/query-sparql'
import { QueryEngine as RdfjsEngine } from '@comunica/query-sparql-rdfjs'
import { Store as N3Store, DataFactory, Parser as N3Parser } from 'n3'

function format(query: string) {
  let result = 'table'
  try {
    result = [...query.matchAll(/#\s*format:\s*(\S+)/g)][0][1]
  } catch (e) {
    console.warn('SPARQL', e)
  }

  return result
}

function sources(query) {
  let result = []

  try {
    const matches = query.matchAll(/#\s*sources?:\s*([^\n]+)/g)

    for (const match of matches) {
      result.push(match[1].split(' ').map((s) => s.trim()))
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

        send(true, formatType === 'table' ? JSON.parse(resultText) : resultText)
      })

      data.on('error', (error: Error) => {
        send(false, error.message)
      })
    } catch (e) {
      send(false, e.message)
    }
  },
}
