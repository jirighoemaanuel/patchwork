export interface PullRequest {
  number: number
  title: string
  state: string
  user: { login: string }
  base: { label: string }
  head: { label: string }
  additions: number
  deletions: number
  changed_files: number
}

export interface PRFile {
  filename: string
  status: 'added' | 'removed' | 'modified' | 'renamed'
  additions: number
  deletions: number
  patch?: string
}

export function parsePRUrl(url: string): { owner: string; repo: string; number: number } | null {
  const match = url.trim().match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2], number: parseInt(match[3]) }
}

export async function fetchPR(owner: string, repo: string, prNumber: number): Promise<PullRequest> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`)
  if (!res.ok) throw new Error(`PR not found (${res.status})`)
  return res.json()
}

export async function fetchPRFiles(owner: string, repo: string, prNumber: number): Promise<PRFile[]> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`)
  if (!res.ok) throw new Error(`Could not fetch files (${res.status})`)
  return res.json()
}
