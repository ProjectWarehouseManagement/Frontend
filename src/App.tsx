import { Routes, Route } from 'react-router-dom';
import Login from "./Login/login";
import Home from "./Home/Home"
import Registration from "./Registration/registration";


const App = () => {
  return (
    <>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />
         </Routes>
      </>
  );
};

export default App;
