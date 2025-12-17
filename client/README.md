# Medical Image Management System - Client

A modern React-based frontend application for the Medical Image Management System, designed for hospitals to manage medical images, patient records, and workflows.

## Features

- **User Authentication**: Secure login system for patients and medical staff
- **Role-based Access**: Different interfaces for patients, doctors, radiologists, and other staff
- **Modern UI**: Built with React and Tailwind CSS for a clean, professional interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests

## Project Structure

```
client/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context providers (Auth, etc.)
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:8001):
```env
VITE_API_BASE_URL=http://localhost:8001
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Authentication

The login system uses:
- **User ID**: Numeric identifier
- **Name**: Full name of the user

After successful login, a JWT token is stored in localStorage and used for authenticated API requests.

## User Types

- **Patient**: Regular patients accessing their medical records
- **Medical Staff**: 
  - Doctors
  - Nurses
  - Technicians
  - Administrators

## API Integration

The client communicates with the backend API running on port 8001 (configurable via environment variables).

### Endpoints Used

- `POST /api/v1/users/login` - User authentication
- `GET /api/v1/users/me` - Get current user information

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add a route in `src/App.jsx`
3. Use `ProtectedRoute` for pages requiring authentication

### Styling

The project uses Tailwind CSS. Custom colors and utilities are defined in:
- `tailwind.config.js` - Theme configuration
- `src/index.css` - Custom component classes

## License

This project is part of a university assignment for Software Architectures course.


