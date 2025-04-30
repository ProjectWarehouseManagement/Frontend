import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Home from "./Home/Home";
import Registration from "./Registration/registration";
import OrdersComponent from './AllIncomingOrders';
import AddOrderForm from './AddOrderModal';
import OutgoingOrdersComponent from './AllOutgoingOrders';
import ProfilePage from './ProfilePage';
import AddDeliveryModal from './AddDeliveryModal';
import LoginForm from './Login/login';

const App = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/registration" element={<Registration />} />
      
      <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/orders" element={isLoggedIn ? <OrdersComponent /> : <Navigate to="/login" replace />} />
      <Route path="/addOrder" element={isLoggedIn ? <AddOrderForm /> : <Navigate to="/login" replace />} />
      <Route path="/OutGoing" element={isLoggedIn ? <OutgoingOrdersComponent /> : <Navigate to="/login" replace />} />
      <Route path="/addDelivery" element={isLoggedIn ? <AddDeliveryModal /> : <Navigate to="/login" replace />} />
      <Route path="/Profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />} />
      
      <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
    </Routes>
  );
};

export default App;