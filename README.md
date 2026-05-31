# Staff Duty Management

Point-based fair shift allocation system built with Next.js.

## Deploy to Vercel (one click)

1. Extract this zip
2. Push to a GitHub repo (or drag-drop the folder into vercel.com)
3. Vercel auto-detects Next.js → click Deploy

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How it works

- Morning = 1 pt (5 staff)
- Evening = 2 pts (3 staff)  
- Night = 3 pts (2 staff)
- Night duty rotates — no one gets a second night until all have had one
- Lowest total points = highest priority for harder shifts
- Data persists in localStorage
# duty-manage-test
