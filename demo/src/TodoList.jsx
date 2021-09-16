import React, { Component } from 'react';
import './todoList.scss';

export function Hello() {
    return <div>Hello World</div>;
}

export default class TodoList extends Component {
    state = { todos: [], text: '' };
    setText = e => {
        this.setState({ text: e.target.value });
    };
    addTodo = () => {
        let { todos, text } = this.state;
        todos = todos.concat({ text });
        this.setState({ todos, text: '' });
    };
    render() {
        const { todos, text } = this.state;

        return (
            <form onSubmit={this.addTodo} action="javascript:">
                <label>
                    <span>Add Todo</span>
                    <input value={text} onInput={this.setText} />
                </label>
                <button type="submit">Add</button>
                <ul>
                    {todos.map(todo => (
                        <li>{todo.text}</li>
                    ))}
                </ul>
            </form>
        );
    }
}