# Spendly

Spendly is a full stack expense tracker. You sign in with Google, add your expenses, set a budget for each month, see where your money went in charts, and ask an AI assistant questions about your spending.

## Features

- Sign in with Google, and every user's data is kept separate
- Add, edit and delete expenses with a category, date and note
- Set a different budget for each month and see how much is left
- Donut chart and top categories for the month
- AI assistant that answers questions about your own spending and suggests a budget for next month

## Built with

- Frontend: HTML, CSS and JavaScript
- Backend: Node.js and Express.js
- Database: MongoDB Atlas with Mongoose
- Login: Google Sign In and JSON Web Tokens
- AI: Google Gemini API

## How it works

1. The browser shows the page and sends requests to the Express server.
2. When a user signs in, Google sends proof of who they are. The server checks it, finds or creates the user in the database, and gives the browser a login pass (a JWT).
3. Every request carries that pass. A middleware checks it, so each user can only see and change their own expenses and budgets.
4. For the assistant, the server collects the user's expenses and budgets, sends them with the question to Gemini, and returns the answer. If a model is slow or busy, the server tries another one.

## Project structure

```
spendly
  backend
    middleware    login check
    models        User, Expense, Budget
    routes        auth, expenses, budgets, chat
    server.js
  frontend
    index.html
    style.css
    script.js
```

## Run it on your computer

1. Download the project and open a terminal inside the `backend` folder.
2. Run `npm install`.
3. Create a file named `.env` in the `backend` folder with these values:

| Name | What it is |
| --- | --- |
| MONGO_URI | Connection link of your MongoDB Atlas database |
| GOOGLE_CLIENT_ID | Client ID from a Google Cloud OAuth client |
| JWT_SECRET | Any long random text, used to sign login passes |
| GEMINI_API_KEY | API key from Google AI Studio |

4. Put the same Google client ID in `frontend/script.js`.
5. Run `node server.js` and open `http://localhost:5000`.

## Notes

- The app runs locally and is not hosted yet.
- Google sign in is in testing mode, so only approved test users can sign in.
- The AI assistant uses the free Gemini plan, which has usage limits.

## Author

Built by Anushka Tyagi.