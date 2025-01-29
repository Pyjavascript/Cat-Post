import {useState,useEffect} from "react"
import { BrowserRouter as Router, Routes, Route,Navigate } from "react-router-dom";
import {Register,Home} from './index'
import { monitorAuthState } from "./firebase/index";
function App() {
   const [user, setUser] = useState(null);
  useEffect(() => {
    monitorAuthState((currentUser) => {
      setUser(currentUser);
      // console.log(currentUser.email);
      
    });
  }, []);

  return (
    <>
      <Router>
        <Routes>
        <Route path="/" element={user ? <Home/> : <Register/>} />
          <Route path="/Home" element={<Home/>} />
          <Route path="/register" element={<Register/>} />
        </Routes>
      </Router>
    </>
  )
}

export default App
