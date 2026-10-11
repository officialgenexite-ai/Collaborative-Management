const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const app = express();
const cors = require('cors');
const compression = require('compression');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const passport = require('./config/passport');
const connectDB = require('./config/database');
  const http = require('http');
const { initSocket } = require('./utils/socketService');
const PORT = 5000;
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Collaborative Management API is running' });
});

const startServer = async () => {
  try {
    await connectDB();

    const passportMiddleware = typeof passport?.initialize === 'function'
      ? passport.initialize()
      : null;

    if (passportMiddleware) {
      app.use(passportMiddleware);
    }
    //mvp1
    const authRoutes = require('./routes/authRoutes');
    const workspaceRoutes = require('./routes/workspaceRoutes');
    const projectRoutes = require('./routes/projectRoutes');
    const taskRoutes = require('./routes/taskRoutes');
    const commentRoutes = require('./routes/commentRoutes');
    const notificationRoutes = require('./routes/notificationRoutes');
    const activityLogRoutes = require('./routes/activityLogRoutes');

    
    const attachmentRoutes = require('./routes/attachmentRoutes');
    // index.js
    const timeLogRoutes = require('./routes/timeLogRoutes');

    // index.js
    const automationRoutes = require('./routes/automationRoutes');
     //mvp 2
    const aiRoutes = require('./routes/aiRoutes');
    const ragRoutes = require('./routes/ragRoutes');
    //mvp 1
    app.use('/api/auth', authRoutes);
    app.use('/auth', authRoutes);
    app.use('/api/workspaces', workspaceRoutes);
    app.use('/api', projectRoutes);
    app.use('/api', taskRoutes);
    app.use('/api', commentRoutes);
    app.use('/api', notificationRoutes);
    app.use('/api', activityLogRoutes);
    app.use('/api', attachmentRoutes);
    app.use('/api', timeLogRoutes);  
    app.use('/api', automationRoutes); 
    
    //mvp 2
    app.use('/api', aiRoutes);
    app.use('/api', ragRoutes);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/api', (req, res) => {
      res.status(404).json({ success: false, message: 'Route not found' });
    });

    app.use(errorHandler);



const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

