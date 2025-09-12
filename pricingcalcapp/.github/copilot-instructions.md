## Project Overview

This is a React.js web application for insulation pricing calculation and quote management. It allows users to parse worksheets, manage master data (materials, labour, customers), and generate quotes with cost and margin calculations.

**Key Technologies:**
*   **Frontend**: React.js, Tailwind CSS (with some legacy Bootstrap-like classes).
*   **Backend**: Google Firebase (Firestore for database, Anonymous Authentication for users).
*   **State Management**: React Context API, with custom providers for each data domain (e.g., `MaterialsContext`, `CustomersContext`).
*   **Routing**: `react-router-dom` at the root, but internal navigation is managed by local state in `MainApplication.js`.

---

## Architecture and Key Patterns

### 1. Authentication: Anonymous & Ephemeral
**CRITICAL**: The application uses **Firebase Anonymous Authentication**. This means user data is tied to a temporary UID stored in the browser. **If a user clears their browser data, their UID is lost, and all associated data becomes inaccessible.** This is a fundamental design choice for data persistence. Any work on user data must account for this ephemeral nature.

### 2. Data Model: User-Scoped Firestore Collections
-   All user-specific data (materials, customers, quotes) is stored in Firestore under the path `artifacts/{currentUser.uid}/{collectionName}`.
-   This isolates user data, but relies entirely on **Firebase Security Rules** (not visible in this repo) to prevent cross-user data access. Assume rules must enforce `request.auth.uid == userId`.
-   A global `colourKeywords` collection exists for shared data and requires its own security rules.

### 3. State Management: The `Authenticated...Provider` Pattern
-   Global state is managed via React's Context API, located in `src/contexts`.
-   A common pattern is a main provider (e.g., `CustomersProvider`) that wraps an `AuthenticatedCustomersProvider`. The wrapper handles the authentication state, and the authenticated provider, which receives `currentUser` as a prop, contains the actual data-fetching and CRUD logic.
-   This ensures that data operations are only attempted for authenticated users.

```javascript
// Example from CustomersContext.js
const CustomersProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // Render the authenticated provider only when a user is available
  return currentUser ? (
    <AuthenticatedCustomersProvider currentUser={currentUser}>
      {children}
    </AuthenticatedCustomersProvider>
  ) : (
    // Provide an empty value for unauthenticated users
    <CustomersContext.Provider value={emptyValue}>
      {children}
    </CustomersContext.Provider>
  );
};
```

### 4. Data Fetching: `useFirestoreCollection` Hook
-   The primary method for fetching real-time data from Firestore is the custom hook `useFirestoreCollection` found in `src/hooks/`.
-   It takes a collection path string (e.g., `artifacts/{uid}/materials`) and returns `{ data, loading, error }`.
-   The hook correctly handles unsubscribing from the listener on unmount.

### 5. Critical Business Logic: Parsing
-   **Worksheet Parsing (`src/components/quote/PasteParser.js`)**: This component contains extremely complex and brittle regex-based logic to parse raw text into a structured quote. It is a major source of potential bugs and is difficult to maintain. Changes here require extreme care and thorough testing.
-   **CSV Parsing (`src/components/common/CSVImporter.js`)**: This component uses a custom, hand-rolled CSV parser (`parseCSVLine`). This is also fragile and should ideally be replaced with a robust library like `PapaParse`. Be cautious when dealing with CSV import logic.

---

## Critical Issues & Areas for Caution

-   **`deleteEntireCollection` Function**: The `src/firebase.js` file exports a powerful and dangerous `deleteEntireCollection` function that is used in the UI (e.g., `MaterialsManager`). This allows an anonymous user to irreversibly delete their entire database for a given collection. This functionality must be handled with extreme care.
-   **Inconsistent Styling**: The codebase contains a mix of Tailwind CSS and legacy Bootstrap-like classes (e.g., `container-fluid`, `card`, `btn`). When creating or modifying components, prefer using **Tailwind CSS** for consistency.
-   **Display Bugs in `sortConfig.js`**: The `prefix` for currency fields in `src/config/sortConfig.js` may be incorrect (e.g., `---` instead of `'$'`). This bug manifests in `MaterialsTable.js`, causing missing currency symbols. Verify and correct this when working with material pricing display.
-   **Unused Code**: The file `src/components/quote/PasteParserInput.js` is an unused, abandoned component. It should be ignored or deleted.

---

## Developer Workflow

-   **Running the app**: Use `yarn start` to run the development server.
-   **Building the app**: Use `yarn build` to create a production build.
-   **Testing**: Use `yarn test` to run the test suite.

---

## Key Files & Directories

-   `src/contexts`: Central hub for global state management.
-   `src/hooks/useFirestoreCollection.js`: The standard for Firestore data fetching.
-   `src/components/quote/PasteParser.js`: The fragile but critical worksheet parsing engine.
-   `src/components/common/CSVImporter.js`: The fragile but critical CSV import engine.
-   `src/firebase.js`: Firebase initialization and dangerous helper functions like `deleteEntireCollection`.
-   `src/config/sortConfig.js`: Contains configuration for sorting and table columns, including potential display bugs.
-   `src/pages`: Top-level components for each view in the application.
-   `src/utils`: Pure utility functions for calculations and data manipulation.
