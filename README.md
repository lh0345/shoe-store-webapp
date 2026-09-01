# Shoe Store Web App

A shoe storefront built as a vanilla JavaScript single-page application.

I used this project to work on a larger front-end codebase without relying on React or another UI framework.

The application contains a product catalog, product pages, filtering, a wishlist, configurable store settings, and a browser-based admin interface.

## What I Implemented

* Structured the application with JavaScript ES modules
* Built a custom client-side router
* Mapped routes to separate view classes
* Created home, collection, product, wishlist, admin, and login views
* Loaded product data from JSON
* Stored browser state with `localStorage`
* Added wishlist behavior
* Added product filtering and details
* Added an admin interface for product and settings changes
* Added MKD and EUR currency display
* Added responsive layouts
* Added Jest tests with jsdom
* Added ESLint and Prettier
* Added Husky pre-commit checks
* Added a Webpack production build
* Added GitHub Actions checks for pushes and pull requests

## What I Learned

This project taught me how a single-page application works underneath a framework.

By writing my own router, I learned how the URL, browser history, application state, and rendered view connect to each other.

Breaking the project into views, services, configuration, routing, and application modules taught me how code organization becomes more important as an application grows.

I also learned more about the difference between browser persistence and server persistence. `localStorage` works for local state and demonstrations, but it does not replace a shared database.

The admin interface taught me the same lesson about authentication. Client-side checks can hide or show parts of an interface, but real authentication requires trusted server-side checks.

Finally, I added tests, linting, formatting, pre-commit checks, builds, and CI so I could practice maintaining code beyond simply making the UI work.

## What This Project Demonstrates

* Vanilla JavaScript application architecture
* Custom SPA routing
* ES modules
* Browser state management
* Testing JavaScript UI code
* Build tooling
* Git hooks
* Continuous integration
* Static deployment

## Tech Used

* JavaScript
* HTML
* CSS
* Webpack
* Jest
* jsdom
* ESLint
* Prettier
* Husky
* GitHub Actions
* `localStorage`
* JSON

## Current Scope

The default version does not contain an in-app payment system.

The admin authentication in the default version runs in the browser and should not be treated as production authentication.

The project contains optional integration work for services such as Supabase, but the default storefront does not depend on a shared hosted database.

## Running the Project

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm test
npm run lint
npm run build
npm run check
```
