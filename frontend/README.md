# Portfolio Management System - Frontend

React.js frontend application for the Portfolio Management System.

## Features

- **Dashboard**: Overview of all portfolios with key metrics
- **Portfolio Management**: Create, view, edit, and delete portfolios
- **Portfolio Analytics**: Detailed performance analysis and asset allocation
- **Real-time Updates**: WebSocket integration for live data updates
- **Responsive Design**: Mobile-friendly interface with Material-UI
- **Interactive Charts**: Performance charts and asset allocation visualization

## Tech Stack

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type safety and better developer experience
- **Material-UI (MUI)**: Component library for consistent UI
- **React Query**: Data fetching and caching
- **React Router**: Client-side routing
- **Recharts**: Data visualization and charts
- **Socket.io**: Real-time WebSocket communication
- **React Hook Form**: Form handling and validation
- **Yup**: Schema validation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:3000

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp env.example .env
   # Edit .env file with your configuration
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Access the application**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components
│   ├── Portfolio/      # Portfolio-related components
│   └── Analytics/      # Analytics and chart components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## Key Components

### Layout Components
- **AppLayout**: Main application layout with navigation
- **Navigation**: Sidebar navigation with menu items

### Portfolio Components
- **PortfolioList**: Grid view of all portfolios
- **PortfolioCard**: Individual portfolio summary card
- **PortfolioForm**: Create/edit portfolio form
- **PortfolioDetail**: Detailed portfolio view with tabs

### Analytics Components
- **AssetAllocationChart**: Pie chart for asset allocation
- **PerformanceChart**: Line chart for performance tracking

## API Integration

The frontend communicates with the backend API through:

- **REST API**: For CRUD operations
- **WebSocket**: For real-time updates
- **React Query**: For data caching and synchronization

### API Endpoints Used

- `GET /api/v1/portfolios` - List portfolios
- `POST /api/v1/portfolios` - Create portfolio
- `GET /api/v1/portfolios/:id` - Get portfolio details
- `PUT /api/v1/portfolios/:id` - Update portfolio
- `DELETE /api/v1/portfolios/:id` - Delete portfolio
- `GET /api/v1/portfolios/:id/nav` - Get portfolio NAV
- `GET /api/v1/portfolios/:id/performance` - Get performance metrics
- `GET /api/v1/portfolios/:id/allocation` - Get asset allocation

## State Management

- **React Query**: Server state management and caching
- **React Hooks**: Local component state
- **Context API**: Global application state (if needed)

## Styling

- **Material-UI**: Component library and theming
- **CSS-in-JS**: Styled components with emotion
- **Responsive Design**: Mobile-first approach
- **Custom Theme**: Brand colors and typography

## Real-time Features

- **WebSocket Connection**: Automatic connection to backend
- **Portfolio Updates**: Real-time portfolio value updates
- **Price Updates**: Live market price updates
- **Trade Updates**: Real-time trade notifications

## Development

### Code Style

- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **JSDoc**: Function documentation

### Testing

- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **MSW**: API mocking for tests

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_WS_URL`: WebSocket server URL
- `REACT_APP_ENV`: Environment (development/production)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
