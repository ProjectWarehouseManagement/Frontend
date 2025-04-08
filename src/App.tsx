import { Routes, Route } from 'react-router-dom';
import Login from "./Login/login";
import Home from "./Home/Home"
import Registration from "./Registration/registration";
import OrdersComponent from './AllIncomingOrders';


const App = () => {
  return (
    <>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/orders" element={<OrdersComponent />} />
         </Routes>
      </>
  );
};

export default App;
