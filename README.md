# Jira Bulk Task Creator

A web application to **bulk create Jira tasks** from Excel, CSV, or JSON data. Easily upload your task list, preview, and create issues in your Jira project with real-time progress and error feedback.

---

## Features

- **Upload Excel (.xlsx, .xls) or CSV files** with task data
- **Manual input:** Paste CSV or JSON task data directly
- **Preview tasks** before creation
- **Bulk create tasks** in Jira with real-time progress (Server-Sent Events)
- **Supports Epic Link** (by URL or key)
- **Optional time estimates** (min/max, averaged)
- **Download JSON** of your parsed tasks and logs
- **Jira connection test** and health check endpoints

---

## Getting Started

### Prerequisites

- Node.js v14 or higher
- A Jira Cloud account with API access
- A Jira API token ([create one here](https://id.atlassian.com/manage-profile/security/api/tokens))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/jira-bulk-creator.git
    cd jira-bulk-creator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    cd client && npm install && cd ..
    ```

3.  **Configure environment variables:**

    Create a `.env` file in the root directory:

    ```
    JIRA_API_TOKEN=your_jira_api_token_here
    ```

    > ⚠️ Your API token is required for authentication with Jira.

4.  **Start the application (development):**
    ```bash
    npm run dev
    ```
    This will start both the React development server (with hot-reloading) and the Node.js backend server concurrently.

5.  **Build and start the application (production):**
    ```bash
    npm start
    ```
    This will first build the React frontend for production and then start the Node.js backend server to serve the built application.

6.  **Open the app:**

    Visit [http://localhost:5173](http://localhost:5173) in your browser (development).
    Visit [http://localhost:3001](http://localhost:3001) in your browser (production).

---

## Usage

### 1. Configure Jira Connection

-   Enter your **Jira URL** (e.g., `https://your-domain.atlassian.net`)
-   Enter your **email** (the one used for Jira)
-   Enter your **Project Key** (e.g., `PROJ`)
-   Select the **Issue Type** (Task, Story, Bug, Epic)

### 2. Provide Task Data

-   **Upload File:** Drag & drop or select an Excel/CSV file.
-   **Manual Input:** Paste CSV or JSON data.

#### File Format

-   **Column A:** Task Name (required)
-   **Column B:** Epic Link (URL or key, optional)

#### Example JSON

```json
[
  { "taskName": "Setup Project", "epicLink": "PROJ-100" },
  { "taskName": "Write Docs", "epicLink": "PROJ-101" }
]
```

### 3. Parse & Preview

-   Click **Parse & Preview** to see your tasks.
-   Review the list before creating.

### 4. Create Tasks

-   Click **Create Tasks in Jira**.
-   Watch real-time progress and logs.
-   Download the JSON log if needed.

---

## API Endpoints

-   `POST /api/upload-tasks` — Upload and parse Excel/CSV files
-   `POST /api/create-tasks-stream` — Bulk create tasks (SSE stream)
-   `POST /api/test-connection` — Test Jira connection
-   `GET /api/health` — Health check
-   `GET /api/debug/epic-field/:projectKey` — Debug Epic Link field

---

## Security

-   **Never share your API token.**
-   The token is only used server-side and never sent to the browser.

---

## Development

-   Frontend: React with Vite in `client/`
-   Backend: Express.js in `server.js`
-   File uploads handled with `multer`
-   Excel/CSV parsing with `xlsx`

---

## License

MIT

---

## Credits

-   [Express](https://expressjs.com/)
-   [Multer](https://github.com/expressjs/multer)
-   [xlsx](https://github.com/SheetJS/sheetjs)
-   [Jira Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)

---

## Troubleshooting

-   **JIRA_API_TOKEN not set:**
    Make sure your `.env` file exists and contains your API token.
-   **CORS issues:**
    The server enables CORS for local development.
-   **Epic Link not working:**
    The app tries to auto-detect the Epic Link field. Use the debug endpoint if needed.

---

## Contributing

Pull requests welcome! Please open an issue first to discuss changes.