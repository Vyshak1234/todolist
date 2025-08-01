import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/todos`);
      setTodos(res.data);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
    }
  };

  const addTodo = async () => {
    if (!text.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/todos`, { text });
      setText('');
      fetchTodos();
    } catch (error) {
      console.error('Error adding todo:', error.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/todos/${id}`);
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error.message);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div className="app">
      <h1>📝 ToDo List</h1>
      <div className="input-section">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter task..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.text}
            <button onClick={() => deleteTodo(todo.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

