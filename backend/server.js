const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
// test

console.log('🔧 Starting Todo API Server...');
console.log('📊 Environment variables loaded');

// CORS configuration - Allow all origins for LoadBalancer setup
app.use(cors({
  origin: true, // Allow all origins (simplified for LoadBalancer setup)
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (important for LoadBalancer health checks)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime()
  });
});

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo API is running!',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      todos: 'GET /todos',
      createTodo: 'POST /todos',
      deleteTodo: 'DELETE /todos/:id'
    },
    timestamp: new Date().toISOString()
  });
});

// Get all todos
app.get('/todos', async (req, res) => {
  try {
    console.log('📋 GET /todos - Fetching todos...');
    const result = await pool.query('SELECT * FROM todos ORDER BY id DESC');
    console.log(`✅ Found ${result.rows.length} todos`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching todos:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Create new todo
app.post('/todos', async (req, res) => {
  try {
    console.log('➕ POST /todos - Creating todo:', req.body);
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      console.log('⚠️  Invalid todo text provided');
      return res.status(400).json({ error: 'Todo text is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO todos (text) VALUES ($1) RETURNING *',
      [text.trim()]
    );
    console.log('✅ Created todo:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating todo:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete todo by ID
app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️  DELETE /todos/' + id);
    
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid todo ID' });
    }
    
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Todo not found with ID:', id);
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    console.log('✅ Deleted todo:', result.rows[0]);
    res.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting todo:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Test database connection on startup
async function testDbConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔧 Check your database configuration');
    return false;
  }
}

// Start the server
app.listen(PORT, '0.0.0.0', async () => {
  console.log('🚀 Todo API Server started successfully!');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`🌐 Server accessible at: http://0.0.0.0:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   GET  / - API info');
  console.log('   GET  /health - Health check');
  console.log('   GET  /todos - Get all todos');
  console.log('   POST /todos - Create todo');
  console.log('   DELETE /todos/:id - Delete todo');
  
  // Test database connection
  const dbConnected = await testDbConnection();
  
  if (dbConnected) {
    console.log('✅ Server is ready to receive requests!');
  } else {
    console.log('⚠️  Server started but database connection failed');
  }
});
