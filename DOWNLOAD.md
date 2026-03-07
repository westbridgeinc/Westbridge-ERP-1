# Download / package this project

## Where the archive is

A zip of the entire Westbridge app (without `node_modules`, `.next`, or generated Prisma files) is at:

**`/Users/westbridgeinc/v1/westbridge-project.zip`**

You can copy or move this file anywhere (Desktop, Downloads, USB, etc.) to share or back it up.

## Create a fresh archive yourself

From the **parent** of the `westbridge` folder (e.g. `v1/`):

```bash
zip -r westbridge-project.zip westbridge \
  -x "westbridge/node_modules/*" \
  -x "westbridge/.next/*" \
  -x "westbridge/.git/*" \
  -x "westbridge/lib/generated/*" \
  -x "*.DS_Store"
```

Or as a tarball (smaller, good for Linux/Mac):

```bash
tar --exclude='westbridge/node_modules' \
    --exclude='westbridge/.next' \
    --exclude='westbridge/.git' \
    --exclude='westbridge/lib/generated' \
    -czvf westbridge-project.tar.gz westbridge
```

## After extracting

1. Copy `.env.example` to `.env` and fill in your values.
2. Run `npm install`.
3. Run `npx prisma generate` (or `npm run build`, which runs it).
4. Run `npm run dev` or see `SETUP.md` for full setup.
