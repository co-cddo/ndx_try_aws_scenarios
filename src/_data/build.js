import { execSync } from 'node:child_process';

function resolveSha() {
  const fromEnv = process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const sha = resolveSha();
const repoUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`
  : 'https://github.com/co-cddo/ndx-try-aws-scenarios';

export default {
  sha,
  shortSha: sha ? sha.slice(0, 7) : null,
  commitUrl: sha ? `${repoUrl}/commit/${sha}` : null
};
