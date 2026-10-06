// Import React and selected hooks from the React package
import React, {
    createContext,   // to create a Context object that can be shared down the tree
    useContext,      // to read a context value from any descendant
    useEffect,       // to run side effects after render
    useMemo,         // to memoize expensive/large values (e.g., context object) across renders
    useRef,          // to hold a mutable ref (e.g., DOM node) that persists across renders
    useState,        // to hold component state and trigger re-renders on change
} from "react";

import ActivityContext from "./ActivityContext.jsx";

/**
 * High-level docs for your future self & learners:
 * This Context will make tasks state and related actions available to any
 * nested component without prop drilling (passing through every level).
 * We’ll expose:
 *  - tasks (array of strings)
 *  - newTask (string input value)
 *  - actions: setNewTask, addTask, deleteTask, moveTaskUp, moveTaskDown
 */

// Create a Context object. `null` is the default (used if no Provider is found).
const startList = [];

/* ----------------------- Provider (state + effects) ----------------------- */
// This component owns the "source of truth" and wraps children with the Provider.
function ToDoProvider({ children }) {
    // useState with a lazy initializer function so localStorage is read only once (on first render)
    const [tasks, setTasks] = useState(() => {
        try {
            // Try to read previously-saved tasks from localStorage
            const saved = localStorage.getItem("todo-tasks");
            // If present, parse JSON; else fall back to sensible defaults
            return saved ? JSON.parse(saved).filter(Boolean).map((task) =>
                typeof task === "string" ? { title: task, description: "", repeat: "None", days: "", time: "" } : task
            ) : startList;
        } catch {
            // If JSON parse or localStorage fails, return defaults to keep app usable
            return startList;
        }
    });

    // Input state for the “new task” text box
    const [newTask, setNewTask] = useState("");
    const [description, setDescription] = useState("");
    const [repeat, setRepeat] = useState("None");
    const [days, setDays] = useState("");
    const [time, setTime] = useState("");

    // Persist tasks to localStorage whenever they change (real-world side effect)
    useEffect(() => {
        // Write the current tasks array to localStorage as JSON
        localStorage.setItem("todo-tasks", JSON.stringify(tasks));
    }, [tasks]); // Dependency array: run effect only when `tasks` changes

    // Log whenever the tasks array changes; also demonstrates cleanup timing
    useEffect(() => {
        console.log(`✅ Tasks changed. Count: ${tasks.length}`);
        // Cleanup runs before the next tasks change OR on unmount
        return () => console.log("🧹 Cleaning up before next tasks change…");
    }, [tasks]); // Again, only when `tasks` changes

    // Add a new task: trim input, no-ops if empty, update immutably, clear input
    const addTask = () => {
        const t = newTask.trim();
        if (!t) return;                       // guard against empty strings
        setTasks((xs) => [...xs, { title: t, description: description.trim(), repeat, days: days.trim(), time }]);
        setNewTask("");                       // reset the input box
        setDescription("");
        setDays("");
        setTime("");
    };

    // Delete a task by index: filter out the matching index (immutable)
    const deleteTask = (index) =>
        setTasks((xs) => xs.filter((_, i) => i !== index));

    // Move a task up by swapping it with the previous item (if not at top)
    const moveTaskUp = (index) =>
        setTasks((xs) => {
            if (index <= 0) return xs;        // can't move top item up
            const arr = [...xs];              // shallow copy to keep immutability
            [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]; // swap
            return arr;
        });

    // Move a task down by swapping it with the next item (if not at bottom)
    const moveTaskDown = (index) =>
        setTasks((xs) => {
            if (index >= xs.length - 1) return xs; // can't move bottom item down
            const arr = [...xs];                   // shallow copy to keep immutability
            [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]]; // swap
            return arr;
        });

    // Memoize the context value to avoid re-rendering all consumers on unrelated changes.
    // Only recalculates when `tasks` or `newTask` change.
    const value = useMemo(
        () => ({ 
            tasks,           // current array of tasks
            newTask,         // current input value
            description, repeat, days, time,
            setDescription, setRepeat, setDays, setTime,
            setNewTask,      // setter to update input value
            addTask,         // action to add a task
            deleteTask,      // action to delete a task
            moveTaskUp,      // action to move task up
            moveTaskDown,    // action to move task down
        }), 
        [tasks, newTask, description, repeat, days, time]
    );

    // Expose the value to all descendants; render the children inside the Provider
    return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

/* --------------------------- Consumer conveniences ------------------------ */
// Small helper hook that ensures we’re inside the provider and returns the context.
function useToDo() {
    const ctx = useContext(ActivityContext);                     // read the context value
    if (!ctx) throw new Error("useToDo must be used inside <ToDoProvider>"); // dev guard
    return ctx;                                              // expose tasks/actions to callers
}

/* ------------------------------- UI pieces -------------------------------- */
// Input component for adding new tasks (reads/writes context)
function NewTaskInput() {
    // Pull only what this component needs from context (keeps it focused)
    const { newTask, setNewTask, description, setDescription, repeat, setRepeat, days, setDays, time, setTime, addTask } = useToDo();
    // Ref to the input DOM node so we can focus it on mount
    const inputRef = useRef(null);

    // On first mount, focus the input (UX enhancement / side effect)
    useEffect(() => {
        inputRef.current?.focus(); // optional chaining protects if ref is null
    }, []); // run once on mount

    // Add task when pressing Enter for keyboard-friendly UX
    const handleKeyDown = (e) => {
        if (e.key === "Enter") addTask();
    };

    // Render input + add button; controlled input mirrors `newTask` state
    return (
        <div className="todo-form">
            <input
                ref={inputRef}                      // attach the ref to the DOM node
                className="newtask"                 // CSS hook
                type="text"                         // text input
                value={newTask}                     // controlled: value comes from state
                onChange={(e) => setNewTask(e.target.value)} // write back to state
                onKeyDown={handleKeyDown}          // add on Enter
                placeholder="Task title"     // UX hint
            />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" aria-label="Description" />
            <select value={repeat} onChange={(e) => setRepeat(e.target.value)} aria-label="Repeat">
                <option>None</option><option>Daily</option><option>Weekly</option>
            </select>
            <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days (e.g. Mon, Wed)" aria-label="Days" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
            <button
                className="add-button"             // CSS hook
                onClick={addTask}                  // click to add
                title="Add task"                   // accessibility/tooltip
            >
                +
            </button>
        </div>
    );
}

// List + item controls (reads context; invokes actions)
function TaskList() {
    // Read tasks and mutation actions from context
    const { tasks, deleteTask, moveTaskUp, moveTaskDown } = useToDo();

    // Render ordered list of tasks with action buttons per item
    return (
        <ol className="todolist">
            {tasks.map((task, index) => (
                <li key={index} className="task-box">
                    <div className="task-content">
                        <strong>{task.title}</strong>
                        {task.description && <p>{task.description}</p>}
                        <div className="task-meta"><span>↻ {task.repeat || "None"}</span><span>◷ {task.time || "Any time"}</span><span>▦ {task.days || "Any day"}</span></div>
                    </div>
                    <div className="task-actions">
                    <button
                        className="delete-button"
                        onClick={() => deleteTask(index)} // remove this index
                        title="Delete"
                    >
                        ×
                    </button>
                    <button
                        className="moveup-button"
                        onClick={() => moveTaskUp(index)} // move up one
                        title="Move up"
                    >
                        ↑
                    </button>
                    <button
                        className="movedown-button"
                        onClick={() => moveTaskDown(index)} // move down one
                        title="Move down"
                    >
                        ↓
                    </button>
                    </div>
                </li>
            ))}
        </ol>
    );
}

/* ------------------------------- App shell -------------------------------- */
// Top-level component for this feature: provides context and renders UI parts.
export default function ToDoListImproved() {
    return (
        <ToDoProvider>             {/* wrap descendants so they can use the context */}
            <div className="todo-panel">
                <NewTaskInput />   {/* input form that reads/writes context */}
                <TaskList />
            </div>
        </ToDoProvider>
    );
}
