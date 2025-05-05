# Ophthalmo AI Practice Hub Monorepo

This project is organized as a monorepo with the following structure:

```
/apps
  /frontend   # React app (moved from root)
  /backend    # Express backend for Daily.co integration (to be added)
```

## Getting Started

### Frontend

```
cd apps/frontend
npm install
npm run dev
```

### Backend (to be implemented)

```
cd apps/backend
npm install
npm run dev
```

## Monorepo Management

- Each app has its own `package.json` and dependencies.
- A root `package.json` will be added to manage workspaces and shared scripts.

---

## Project Purpose

This project is for ophthalmology interview practice, including video call functionality via Daily.co.

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/574bb2cb-30e0-4c15-aad5-1dbc41ce4761

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/574bb2cb-30e0-4c15-aad5-1dbc41ce4761) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/574bb2cb-30e0-4c15-aad5-1dbc41ce4761) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
