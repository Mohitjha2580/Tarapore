# School Engagement Platform Backend

A scalable, secure, production-ready backend API for a gamified school engagement platform with role-based authentication, real-time features, and comprehensive analytics.

## 🚀 Features

- **Role-based Authentication**: JWT-based auth with refresh tokens for students, teachers, and principals
- **Gamification System**: Points, badges, streaks, and leaderboards
- **Real-time Updates**: WebSocket support for live notifications
- **File Upload**: Profile pictures and wall of fame images with AWS S3/Cloudinary
- **Analytics & Reporting**: Comprehensive analytics for student performance
- **Rate Limiting**: Redis-based rate limiting for security
- **Caching**: Redis caching for improved performance
- **Email Integration**: SendGrid/AWS SES for notifications
- **Input Validation**: Zod schemas for request validation
- **Comprehensive Logging**: Winston logging with multiple transports
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, password hashing, and more

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.io for live updates
- **File Storage**: AWS S3 or Cloudinary
- **Email**: SendGrid or AWS SES
- **Caching**: Redis for session management
- **Validation**: Zod for request validation
- **Testing**: Jest with Supertest
- **Documentation**: OpenAPI/Swagger
- **Monitoring**: Winston for logging

### Database Schema

The platform uses a comprehensive database schema supporting:

- **Users**: Role-based user management (students, teachers, principals)
- **Points**: Gamification with categories and multipliers
- **Badges**: Achievement system with rarity levels
- **Streaks**: Daily activity tracking
- **Events**: School events and activities
- **Wall of Fame**: Monthly student recognition
- **Social Features**: Friendships and activity feeds
- **Challenges**: Daily challenges for engagement

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd school-engagement-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database Setup**
```bash
# Generate Prisma client
npm run generate

# Run migrations
npm run migrate

# Seed the database (optional)
npm run seed
```

5. **Start the application**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `SENDGRID_API_KEY` | SendGrid API key | - |

### School Email Format

The platform expects school emails in the format: `grade/studentId@taraporeschool.com`

- **Students**: `12/1234@taraporeschool.com`
- **Teachers**: `12/T001@taraporeschool.com` (prefix with 'T')
- **Principal**: `12/P001@taraporeschool.com` (prefix with 'P')

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### User Management

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users/leaderboard` - Get leaderboard
- `GET /api/v1/users/search` - Search users

### Points & Gamification

- `GET /api/v1/points/my-points` - Get user points
- `POST /api/v1/points/award` - Award points (teachers/principals)
- `GET /api/v1/points/history` - Points history
- `GET /api/v1/badges/available` - Available badges
- `GET /api/v1/badges/my-badges` - User's badges

### Sample API Responses

#### Successful Login
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "12/1234@taraporeschool.com",
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "house": "red",
      "grade": 12
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  },
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Invalid credentials",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## 🔐 Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Tokens**: Access tokens (15min) + refresh tokens (7 days)
- **Rate Limiting**: Different limits for auth vs API endpoints
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS Protection**: Configurable origins
- **Security Headers**: Helmet middleware
- **Audit Logging**: All authentication events logged

## 🎮 Gamification System

### Points System
- **Categories**: Academic, Sports, Arts, Leadership, Participation
- **Multipliers**: Streak bonuses, house competitions
- **Daily Limits**: Prevent point farming
- **Real-time Updates**: Instant notifications

### Achievement System
- **Badge Types**: Points-based, streak-based, participation-based
- **Rarity Levels**: Common, Rare, Epic, Legendary
- **Secret Badges**: Hidden achievements
- **Progress Tracking**: Real-time progress updates

### House System
- **Four Houses**: Red, Blue, Green, Yellow
- **Competition**: House-based leaderboards
- **Multipliers**: House competition bonuses

## 📊 Analytics & Reporting

### Student Analytics
- Points breakdown by category
- Badge progress and achievements
- Streak tracking
- Activity participation

### Teacher Dashboard
- Class performance overview
- Student progress tracking
- Points awarding interface
- Event management

### Principal Dashboard
- School-wide analytics
- User management
- System configuration
- Performance metrics

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual components and utilities
- **Integration Tests**: API endpoints and business logic
- **Authentication Tests**: JWT handling and security
- **Database Tests**: Data operations and consistency

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**
   - Set production environment variables
   - Configure secure JWT secrets (32+ characters)
   - Set up production database
   - Configure Redis instance

2. **Security**
   - Enable HTTPS
   - Configure proper CORS origins
   - Set up rate limiting
   - Enable audit logging

3. **Performance**
   - Configure database connection pooling
   - Set up Redis caching
   - Enable compression
   - Optimize query performance

4. **Monitoring**
   - Set up logging aggregation
   - Configure health checks
   - Monitor database performance
   - Set up alerts

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Development

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript types
├── utils/          # Utility functions
├── database/       # Database seeds and migrations
└── tests/          # Test files
```

### Coding Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format
- **Path Mapping**: `@/` for src imports

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 API Versioning

The API uses URL versioning (`/api/v1/`) to ensure backward compatibility. Breaking changes will increment the version number.

## 🔧 Health Monitoring

### Health Check Endpoint

`GET /health` returns:

```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 52428800,
    "heapTotal": 41943040,
    "heapUsed": 28829184
  },
  "version": "1.0.0"
}
```

### Logging

Winston logger with multiple transports:
- Console output (development)
- File rotation (production)
- Error level filtering
- Structured JSON logging

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This is a production-ready backend that requires proper configuration and security setup before deployment.