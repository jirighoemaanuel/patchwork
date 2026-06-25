import { useState } from 'react'
import { parsePRUrl, fetchPR, fetchPRFiles } from './lib/github'
import type { PullRequest, PRFile } from './lib/github'

type Status = 'idle' | 'loading' | 'error' | 'done'

function fileStatusColor(status: PRFile['status']) {
  if (status === 'added') return 'text-[#3fb950]'
  if (status === 'removed') return 'text-[#f85149]'
  return 'text-[#8b949e]'
}

function fileStatusLabel(status: PRFile['status']) {
  if (status === 'added') return 'A'
  if (status === 'removed') return 'D'
  if (status === 'renamed') return 'R'
  return 'M'
}

function App() {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [pr, setPr] = useState<PullRequest | null>(null)
  const [files, setFiles] = useState<PRFile[]>([])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parsePRUrl(input)
    if (!parsed) {
      setError('Invalid GitHub PR URL. Expected: https://github.com/owner/repo/pull/123')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')
    setPr(null)
    setFiles([])

    try {
      const [prData, filesData] = await Promise.all([
        fetchPR(parsed.owner, parsed.repo, parsed.number),
        fetchPRFiles(parsed.owner, parsed.repo, parsed.number),
      ])
      setPr(prData)
      setFiles(filesData)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col">

      {/* Nav */}
      <header className="border-b border-[#21262d] px-6 py-4 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide">Patchwork</span>
        <span className="text-xs text-[#8b949e]">Live code review rooms</span>
      </header>

      <main className="flex flex-col items-center px-4 py-12 flex-1">

        {/* Input card */}
        <div className="w-full max-w-xl">
          {status === 'idle' && (
            <>
              <h1 className="text-2xl font-semibold mb-2">Start a review room</h1>
              <p className="text-sm text-[#8b949e] mb-6">Paste a public GitHub PR URL to load the diff.</p>
            </>
          )}

          <form onSubmit={handleSubmit} className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
            <label className="block text-xs text-[#8b949e] mb-2 font-medium uppercase tracking-wider">
              GitHub PR URL
            </label>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || status === 'loading'}
              className="mt-3 w-full bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium py-2 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Fetching…' : 'Load PR'}
            </button>
          </form>

          {/* Error */}
          {status === 'error' && (
            <p className="mt-3 text-sm text-[#f85149] bg-[#161b22] border border-[#f8514933] rounded-md px-4 py-3">
              {error}
            </p>
          )}
        </div>

        {/* PR result */}
        {status === 'done' && pr && (
          <div className="w-full max-w-xl mt-8 space-y-4">

            {/* PR metadata */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-[#238636] text-white px-2 py-0.5 rounded-full font-medium">
                  {pr.state}
                </span>
                <span className="text-xs text-[#8b949e]">#{pr.number}</span>
              </div>
              <h2 className="text-base font-semibold mt-2 mb-3">{pr.title}</h2>
              <div className="text-xs text-[#8b949e] flex flex-wrap gap-4">
                <span>by <span className="text-[#e6edf3]">{pr.user.login}</span></span>
                <span>
                  <span className="text-[#e6edf3]">{pr.base.label}</span>
                  {' ← '}
                  <span className="text-[#e6edf3]">{pr.head.label}</span>
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-xs">
                <span className="text-[#3fb950]">+{pr.additions}</span>
                <span className="text-[#f85149]">−{pr.deletions}</span>
                <span className="text-[#8b949e]">{pr.changed_files} files changed</span>
              </div>
            </div>

            {/* File list */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-[#21262d] text-xs text-[#8b949e] font-medium uppercase tracking-wider">
                Changed files
              </div>
              <ul>
                {files.map(file => (
                  <li
                    key={file.filename}
                    className="flex items-center justify-between px-5 py-2.5 border-b border-[#21262d] last:border-0 text-sm hover:bg-[#1c2128] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-mono font-bold text-xs w-4 shrink-0 ${fileStatusColor(file.status)}`}>
                        {fileStatusLabel(file.status)}
                      </span>
                      <span className="text-[#e6edf3] truncate font-mono text-xs">{file.filename}</span>
                    </div>
                    <div className="flex gap-2 text-xs shrink-0 ml-4">
                      <span className="text-[#3fb950]">+{file.additions}</span>
                      <span className="text-[#f85149]">−{file.deletions}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}

      </main>

      <footer className="border-t border-[#21262d] px-6 py-4 text-center text-xs text-[#484f58]">
        No account required · Public repos only
      </footer>

    </div>
  )
}

export default App
