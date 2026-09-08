# media/

Files here are **not** part of the website image. On every deploy, GitHub Actions
syncs `media/training-videos/` to the public Blob Storage container
`sthumanityplusai / training-videos`, and the site streams them from there.

To publish a Claude Hacks clip, run `scripts/publish-clip.sh` (see
`deploy/AZURE_RUNBOOK.md`). Keep clips under ~10 MB (H.264, fast-start).
