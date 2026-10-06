import Header from './components/Header'
import ToDoList from "./components/ToDoList"
import Profile from "./components/Profile"
import './css/style.css'

function App() {
  return (
    <>
        <Header />
        <Profile name="Ikram" age={24} position="Software Engineer" />
        <ToDoList />

    </>
  )
}

export default App
