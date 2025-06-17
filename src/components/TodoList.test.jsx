import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoList from './TodoList';

describe('TodoList Component', () => {
  beforeEach(() => {
    render(<TodoList />);
  });

  it('renders the input and add button', () => {
    expect(screen.getByPlaceholderText('Add new task')).toBeInTheDocument();
    expect(screen.getByText(/add/i)).toBeInTheDocument();
  });

  it('can add a new task and display it', () => {
    const input = screen.getByPlaceholderText('Add new task');
    fireEvent.change(input, { target: { value: 'Test Task' } });

    const addButton = screen.getByText(/add/i);
    fireEvent.click(addButton);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('can reschedule a task to "Tomorrow"', () => {
    const input = screen.getByPlaceholderText('Add new task');
    fireEvent.change(input, { target: { value: 'Reschedule Task' } });

    fireEvent.click(screen.getByText(/add/i));

    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'tomorrow' } });

    // This doesn't verify visual date, but ensures dropdown accepted change
    expect(dropdown.value).toBe('tomorrow');
  });

  it('can add a subtask and display progress (1/1)', () => {
    const taskInput = screen.getByPlaceholderText('Add new task');
    fireEvent.change(taskInput, { target: { value: 'Main Task' } });
    fireEvent.click(screen.getByText(/add/i));

    const subtaskInput = screen.getByPlaceholderText('Add subtask');
    fireEvent.change(subtaskInput, { target: { value: 'Sub 1' } });
    fireEvent.keyDown(subtaskInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('0 / 1 subtasks done')).toBeInTheDocument();

    // Check subtask toggle
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByText('1 / 1 subtasks done')).toBeInTheDocument();
  });

  it('can mark a task as done', () => {
    fireEvent.change(screen.getByPlaceholderText('Add new task'), {
      target: { value: 'Done Task' }
    });
    fireEvent.click(screen.getByText(/add/i));

    const doneButton = screen.getByText('Done');
    fireEvent.click(doneButton);

    expect(screen.getByText('Undo')).toBeInTheDocument();
  });
});
