# Influencer CRM Frontend

Modern, type-safe frontend for the Influencer CRM system built with Next.js 15, TypeScript, and Shadcn/ui.

## Features

- **Modern Tech Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit + Tanstack Query
- **Type Safety**: Full TypeScript with strict type checking
- **UI Components**: Shadcn/ui with custom red/black theme
- **Form Handling**: React Hook Form + Zod validation
- **Real-time Updates**: Automatic data refetching with Tanstack Query

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Redux Toolkit
- Tanstack Query (React Query)
- Shadcn/ui
- React Hook Form
- Zod
- Axios
- Tailwind CSS

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Set the backend API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/                    # Next.js App Router pages
  auth/                # Authentication pages
  dashboard/           # Dashboard page
  influencers/         # Influencer management
  contracts/           # Contract management
  campaigns/           # Campaign management
  email-templates/     # Email template management
  emails/              # Email history
components/            # Reusable components
  ui/                  # Shadcn/ui components
  layout/              # Layout components
  forms/               # Form components
  tables/              # Table components
lib/                   # Utilities and configuration
  api/                 # API client and services
  store/               # Redux store
  hooks/               # Custom hooks
types/                 # TypeScript type definitions
```

## Key Features

### Authentication
- Secure login/registration with JWT
- Redux state persistence
- Automatic token injection
- Auto-redirect on 401

### Dashboard
- Real-time statistics
- Pipeline visualization
- Activity tracking

### Influencer Management
- Full CRUD operations
- Search and filtering
- Pagination
- Status tracking
- Bulk operations

### Contract Management
- Contract lifecycle tracking
- Campaign association
- Status management

### Campaign Management
- Campaign creation and tracking
- Influencer assignment
- Budget tracking

### Email System
- Template-based emails
- Variable substitution
- Bulk sending
- Email history

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (required)

