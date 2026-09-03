# Push to GitHub

```bash
git push https://<USER>:<TOKEN>@github.com/wotiler-star/photogov-clone.git main
```

Never commit a real token. Use `<TOKEN>` placeholder or an env var:

```bash
git push "https://wotiler-star:${GITHUB_TOKEN}@github.com/wotiler-star/photogov-clone.git" main
```

## Sandbox note (DNS)

Some sandboxes poison `github.com` DNS (resolves to a black-hole IP like `198.18.0.4`).
If `git push` fails with `SSL_ERROR_SYSCALL` or `could not read Username`, pin real IPs in `/etc/hosts`:

```
140.82.121.3  github.com
140.82.121.5  api.github.com
```

Verify with:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://github.com
```

## If a token was ever committed

```bash
printf 'regex:ghp_[A-Za-z0-9]{20,}==>***REMOVED_GITHUB_TOKEN***\n' > /tmp/replacements.txt
git filter-repo --replace-text /tmp/replacements.txt --force
git push --force origin main
```

Then **revoke the token** — rewriting history does not un-leak a secret from a public repo.
