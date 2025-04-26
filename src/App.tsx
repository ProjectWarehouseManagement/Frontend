import { Routes, Route } from 'react-router-dom';
import Login from "./Login/login";
import Home from "./Home/Home"
import Registration from "./Registration/registration";
import OrdersComponent from './AllIncomingOrders';
import AddOrderForm from './AddOrderModal';
import OutgoingOrdersComponent from './AllOutgoingOrders';
import ProfilePage from './ProfilePage';


const App = () => {
  return (
    <>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/orders" element={<OrdersComponent />} />
            <Route path="*" element={<Home />} /> {/* Fallback route */}
            <Route path="/addOrder" element={<AddOrderForm />} /> {/* Fallback route */}
            <Route path="/OutGoing" element={<OutgoingOrdersComponent/>} />
            <Route path="/Profile" element={<ProfilePage />} /> {/* Fallback route */}
         </Routes>
      </>
  );
};

export default App;
