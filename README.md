# React Router 7 SSR Template

A minimal starter template for server-side rendering (SSR) with React Router 7 and Express 5. Inspired by [epic-stack](https://github.com/epicweb-dev/epic-stack), but intentionally simplified to provide a clean foundation for your own features.

## Stack

- **Express 5** (custom server)
- **React 19**
- **React Router 7**
- **Tailwind CSS 4**

## Features

- Server-side rendering with Express
- Basic routing setup with React Router 7
- Tailwind CSS 4 for styling
- Minimal boilerplate—add your own features as needed

## Getting Started

1. **Install dependencies:**
  ```bash
  npm install
  ```

2. **Create a valid .env file**
  an .env.example file is provided

3. **Run the development server:**
  ```bash
  npm run dev
  ```

4. **Build for production:**
  ```bash
  npm run build
  ```

## Project Structure

```
.
├── server/         # Express server code
├── app/            # React Router app source
├── public/         # Static assets
└── other/          # build script for production server
```

## Customization

This template is intentionally basic. Add authentication, data fetching, testing, or any other features as your project grows.

## License

MIT