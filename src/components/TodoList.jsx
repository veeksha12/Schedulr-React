// src/components/TodoList.jsx
import { useState } from 'react';
import './designs/TodoList.css'; // Assuming you have some basic styles in this file

const getNextMonday = () => {
  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
  return nextMonday.toISOString().split('T')[0];
};

const getSaturday = () => {
  const today = new Date();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
  return saturday.toISOString().split('T')[0];
};

export default function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [customDateTaskId, setCustomDateTaskId] = useState(null);
  const [calendarDate, setCalendarDate] = useState('');

  const addTask = () => {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      title: newTask,
      dueDate: new Date().toISOString().split('T')[0],
      completed: false,
      subtasks: [],
      logs: [],
    };
    setTasks([...tasks, task]);
    setNewTask('');
  };

  const addSubtask = (taskId, text) => {
    setTasks(tasks.map(task => task.id === taskId ? {
      ...task,
      subtasks: [...task.subtasks, { id: Date.now(), text, done: false }]
    } : task));
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(tasks.map(task => task.id === taskId ? {
      ...task,
      subtasks: task.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s)
    } : task));
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => task.id === taskId ? {
      ...task,
      completed: !task.completed,
      logs: [...task.logs, { action: task.completed ? 'Undone' : 'Done', date: new Date() }]
    } : task));
  };

  const rescheduleTask = (taskId, optionOrDate) => {
    const today = new Date().toISOString().split('T')[0];
    let newDate = null;
    if (optionOrDate === 'today') newDate = today;
    else if (optionOrDate === 'tomorrow') newDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    else if (optionOrDate === 'weekend') newDate = getSaturday();
    else if (optionOrDate === 'nextweek') newDate = getNextMonday();
    else if (optionOrDate === 'none') newDate = null;
    else newDate = optionOrDate; // direct date

    setTasks(tasks.map(task => task.id === taskId ? {
      ...task,
      dueDate: newDate,
    } : task));
    setCustomDateTaskId(null);
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.completed) return false;
    const now = new Date().toISOString().split('T')[0];
    return task.dueDate < now;
  };

  const tasksForDate = (date) => {
    return tasks.filter(task => task.dueDate === date);
  };

  return (
    <div>
      <h3>To-do List</h3>
      <input
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Add new task"
      />
      <button onClick={addTask}>Add</button>

      <div style={{ marginTop: '2em', padding: '1em', border: '1px solid #ccc' }}>
        <h4>View Tasks by Date</h4>
        <input
          type="date"
          value={calendarDate}
          onChange={(e) => setCalendarDate(e.target.value)}
        />
        {calendarDate && (
          <div style={{ marginTop: '1em' }}>
            <h5>Tasks on {calendarDate}:</h5>
            {tasksForDate(calendarDate).length === 0 ? (
              <p>No tasks for this date.</p>
            ) : (
              <ul>
                {tasksForDate(calendarDate).map(task => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {tasks.map(task => (
        <div key={task.id} style={{ margin: '1em 0', padding: '1em', border: '1px solid gray' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{task.title}</strong>
              {isOverdue(task) && <span style={{ color: 'red', marginLeft: '1em' }}>Overdue</span>}
              <div>
                {task.subtasks.filter(s => s.done).length} / {task.subtasks.length} subtasks done
              </div>
            </div>
            <div>
              <button onClick={() => toggleTask(task.id)}>
                {task.completed ? 'Undo' : 'Done'}
              </button>
              <select
                onChange={(e) => {
                  if (e.target.value === 'custom') setCustomDateTaskId(task.id);
                  else rescheduleTask(task.id, e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>Reschedule</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="weekend">This Weekend</option>
                <option value="nextweek">Next Week</option>
                <option value="none">No Date</option>
                <option value="custom">Pick a Date...</option>
              </select>
              {customDateTaskId === task.id && (
                <input
                  type="date"
                  onChange={(e) => rescheduleTask(task.id, e.target.value)}
                />
              )}
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          </div>
          <div>
            <input
              placeholder="Add subtask"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addSubtask(task.id, e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <ul>
              {task.subtasks.map(subtask => (
                <li key={subtask.id}>
                  <input
                    type="checkbox"
                    checked={subtask.done}
                    onChange={() => toggleSubtask(task.id, subtask.id)}
                  /> {subtask.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
