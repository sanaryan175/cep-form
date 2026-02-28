# CEP Financial Awareness Survey

A MERN stack application for collecting community feedback on financial awareness and loan literacy, with real-time analytics dashboard.

## Features

- **Multi-section Survey Form**: Interactive survey with 5 sections covering basic information, loan awareness, financial risk experience, rental awareness, and platform needs
- **Real-time Analytics Dashboard**: Comprehensive data visualization with charts and metrics
- **MongoDB Integration**: Secure data storage with proper schema design
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Data Validation**: Form validation and error handling
- **Rate Limiting**: API protection against abuse

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- CORS, Helmet, Rate Limiting
- Environment variables with dotenv

### Frontend
- React 18
- React Router for navigation
- Tailwind CSS for styling
- Recharts for data visualization
- Lucide React for icons
- Axios for API calls

## Project Structure

```
cep-form/
├── server/
│   ├── controllers/
│   │   ├── surveyController.js
│   │   └── analyticsController.js
│   ├── models/
│   │   └── Survey.js
│   ├── routes/
│   │   ├── survey.js
│   │   └── analytics.js
│   ├── .env
│   └── index.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SurveyForm.js
│   │   │   └── Dashboard.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── tailwind.config.js
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
npm run install-client
```

### 2. Environment Setup

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb://localhost:27017/cep-survey
PORT=5000
NODE_ENV=development
```

### 3. Start the Application

#### Development Mode (Recommended)
```bash
npm run dev
```
This will start both the backend server (port 5000) and frontend development server (port 3000) concurrently.

#### Production Mode
```bash
# Start backend only
npm start

# Build and serve frontend
npm run build
# Serve the build folder with your preferred static server
```

## API Endpoints

### Survey Routes
- `POST /api/survey` - Submit new survey response
- `GET /api/survey` - Get all survey responses (with pagination)
- `GET /api/survey/stats` - Get survey statistics

### Analytics Routes
- `GET /api/analytics/dashboard` - Get comprehensive dashboard data
- `GET /api/analytics/section/:section` - Get section-specific analytics

### Health Check
- `GET /api/health` - Server health check

## Survey Sections

1. **Basic Information**: Age group, occupation, loan experience
2. **Loan Awareness**: Understanding of interest rates, EMIs, hidden charges
3. **Financial Risk Experience**: Fraud experience, agreement reading habits
4. **Rental/Agreement Awareness**: Rental agreement experience and understanding
5. **Validation Platform Need**: Interest in risk validation platform and desired features

## Dashboard Features

- **Key Metrics**: Total responses, daily responses, average risk perception, platform interest
- **Daily Trends**: Line chart showing response trends over time
- **Demographics**: Age distribution, occupation breakdown
- **Loan Analytics**: Understanding levels, hidden charges experience
- **Risk Analysis**: Fraud experience rates, agreement reading habits
- **Platform Insights**: Feature preferences, common fears

## Data Schema

The survey data includes:
- Demographic information (age, occupation)
- Loan awareness metrics
- Financial risk experiences
- Rental agreement awareness
- Platform validation needs
- Risk perception scores
- Timestamps and metadata

## Security Features

- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
