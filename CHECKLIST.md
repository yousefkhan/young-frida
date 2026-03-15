# young-frida – 2-Day Checklist

Small tasks to complete over 2 days. Check off each when done.

---

## Day 1 – Understand and customize

- [ ] Clone repo and open in editor.
- [ ] Run the app locally: `cd server && npm install && node server.js`, open http://localhost:3000
- [ ] Open `server/data/transactions.js` and add or edit one transaction; refresh the page and see it in the table.
- [ ] Open `server/server.js` and find the `/api/transactions` route; read how the mock data is returned.
- [ ] Open `public/app.js` and see how `fetch` and the table are built; change one label or table header.
- [ ] Edit `public/styles.css`: change table border color or row spacing; save and refresh.
- [ ] (Optional) Add a new item to one order’s `items` array and show it in the table.

---

## Day 2 – Refresh button, Docker, deploy

- [ ] Add a Refresh button in `index.html`; in `app.js`, on click, call `fetch('/api/transactions')` again and re-render the table.
- [ ] (Optional) Show "Loading..." while fetch runs; hide it when data arrives.
- [ ] (Optional) If `fetch` fails, show a short error message on the page.
- [ ] Add `server/Dockerfile`: Node image, copy app, `npm install`, expose 3000, `CMD ["node", "server.js"]`.
- [ ] Add `docker-compose.yml` at repo root: one service that builds from `./server` and maps port 3000:3000.
- [ ] Run locally with Docker: `docker-compose up --build`, open http://localhost:3000, confirm table loads.
- [ ] Deploy: copy repo to your server, run `docker-compose up -d`, ensure port 3000 is open (or behind nginx).
- [ ] Open the server URL in a browser and confirm the transactions table loads.
