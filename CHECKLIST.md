# young-frida – Checklist

Tasks to complete. Check off each when done. Order is frontend first, then backend and full-stack.

---

- [ ] Clone repo, run the app locally, and open it in the browser.
- [ ] Trace how the API serves data and how the frontend fetches and renders the table. Change one label or header.
- [ ] Make the UI look good in `styles.css`:
  - [ ] Improve typography (font family, sizes, hierarchy).
  - [ ] Set a clear color palette (background, text, accents) and use it consistently.
  - [ ] Improve table styling (borders, spacing, header distinction, row hover).
  - [ ] Add spacing and layout so the page doesn’t feel cramped.
  - [ ] Anything you would like to improve :)
- [ ] Add a Refresh button that fetches transactions again and re-renders the table.
- [ ] (Optional) Show "Loading..." while fetching; show a short error message if fetch fails.
- [ ] add these fields { street: String, houseNumber: String, postCode: String } to the address model.
- [ ] Add one new transaction to the data; confirm it appears in the table.
- [ ] Add an API that returns the maximum transaction amount. Show that value separately on the page (not in the table).
- [ ] (Optional) Add a new item to one order’s `items` array and confirm it shows in the table.
- [ ] Add a Dockerfile for the server and a `docker-compose.yml` at repo root. Run with Docker and confirm the table loads.
- [ ] Deploy to a server. Confirm the live URL shows the transactions table.
