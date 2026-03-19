import { useState, useEffect, useRef } from 'react'

export function useQuery(fetchers) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const ref = useRef(fetchers)

  useEffect(() => {
    let cancelled = false
    const keys = Object.keys(ref.current)
    const fns  = Object.values(ref.current)

    setState(s => ({ ...s, loading: true, error: null }))

    Promise.all(fns.map(fn => fn()))
      .then(results => {
        if (cancelled) return
        const data = {}
        keys.forEach((k, i) => { data[k] = results[i] })
        setState({ data, loading: false, error: null })
      })
      .catch(err => {
        if (cancelled) return
        setState({ data: null, loading: false, error: err.message })
      })

    return () => { cancelled = true }
  }, [])

  return state
}
