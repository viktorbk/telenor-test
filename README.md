**Home Assignment:**
- **For the front-end: Use pure javascript or a framework Vue 3 and Typescript.**
- **For the backend: Use ASP.NET Core as a framework.**
- **You can use Wikipedia as a source for the text. 500 words or so should suffice.**
- **Structure the code and provide clear instructions on how to run in.**
- **Should be usable by pointing a web browser to http://localhost:8080/ after running.**
- **Post project on a github and make it available for reviewers. Please send the link to the project to the meeting invitees before the interview.**

**Description:**
**Develop a tested backend and frontend solution that displays text on a webpage. Allow the user to select a substring of the text. A button should be present on the page. The selected text should be posted using an asynchronous HTTP request back to the server if the user clicks the button. The server should return a new string and a random color value back as a response. The frontend should replace the original subtext with the one returned from the backend, and render it on a background with the color value returned. The text returned by the server should be the original substring, but the first character of all the words should be capitalised by the backend.**

- **No persistence is required. Reloading the page should render the original text.**
- **No login or permission management is required.**
- **Keep it clean and simple. Write readable code. Functionality takes priority over visual design.**

**Solution:**
This repo contains two frontends (`client/vuejs` and `client/purejs`) and an ASP.NET Core minimal API backend.

**Prerequisites**
- .NET SDK `10.0` (preview)
- Node.js `^20.19.0 || >=22.12.0` (only needed for `client/vuejs`)
- Python 3 (optional, to serve `client/purejs`)

**Getting started (from git clone to running)**
1) **Clone and enter the repo**
```bash
git clone https://github.com/viktorbk/telenor-test
cd telenor-test
```

2) **Start the backend (Terminal 1)**
```bash
cd server/dotnet-minimal
dotnet restore
dotnet run
```
The API runs on `http://localhost:5000` in Development.

3) **Start a frontend (Terminal 2)**
Pick one of the options below.

**Option A: Vue 3 + TypeScript**
```bash
cd client/vuejs
npm install
npm run dev
```
The app runs on `http://localhost:8080`.

**Option B: Pure JavaScript + CSS**
```bash
cd client/purejs
python3 -m http.server 8080
```
The app runs on `http://localhost:8080`.

4) **Open the app**
Visit `http://localhost:8080` in your browser.

**Configuration**
- `client/vuejs` uses `VITE_API_URL` if set; otherwise it defaults to `http://localhost:5000`.
- `client/purejs` uses the `apiUrl` constant in `client/purejs/app.js` (defaults to `http://localhost:5000`).

**Tests**
- **Backend (xUnit)**: `server/dotnet-minimal.Tests` covers the `/format` endpoint behavior.
  ```bash
  cd server/dotnet-minimal.Tests
  dotnet test
  ```
- **Frontend (Playwright E2E)**: located in `client/vuejs/e2e`.
  ```bash
  cd client/vuejs
  npm install
  npm run test:e2e
  ```
