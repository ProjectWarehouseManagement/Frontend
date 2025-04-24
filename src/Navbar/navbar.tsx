import React, { useContext, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./navbar.css";
import { useAuth } from "../AuthContext";
import { ProviderModal } from "../ProviderModal";

const NavigationBar = () => {
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

  const closeMenu = () => {
    const navbarCollapse = document.querySelector(".navbar-collapse") as HTMLElement;
    if (navbarCollapse.classList.contains("show")) {
      navbarCollapse.classList.remove("show");
    }
  };

  const handleAddProviderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProviderModalOpen(true);
    closeMenu();
  };

  useEffect(() => {
    closeMenu();
  }, [location]);
  return (<>
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">
          Saxon Kitchenware
        </Link>
        <button
          className="navbar-toggler mt-0 p-0"
          style={{height: "40px", width: "40px"}}
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item active">
              <NavLink to="/" className="nav-link">Home</NavLink>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="aboutDropdown" role="button" data-bs-toggle="dropdown">
                Megrendelesek Hozzaadasa
              </a>
              <ul className="dropdown-menu">
                <li><NavLink to="/addDelivery" className="dropdown-item">Kimeno Megrendeles</NavLink></li>
                <li><NavLink to="/addOrder" className="dropdown-item">Bejovo Megrendeles</NavLink></li>
                <li>
                    <a 
                      href="#" 
                      className="dropdown-item" 
                      onClick={handleAddProviderClick}
                    >
                      Beszallito hozzaadasa
                    </a>
                  </li>
              </ul>
            </li>
            <li className="nav-item">
              <NavLink to="/orders" className="nav-link">Minden bejovo megrendeles</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/OutGoing" className="nav-link">Minden kimeno megrendeles</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/gallery" className="nav-link">Aktiv szamlak</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/contact" className="nav-link">Contact</NavLink>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink to="/profile" className="nav-link">
                <span className="glyphicon glyphicon-user"></span> Profil
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              {isLoggedIn ? (
                <div>
                <button className="btn btn-danger" onClick={logout}>Kijelentkezés</button>
              </div>
                
              ) : (
                <div>
                  <a className="nav-link dropdown-toggle" href="#" id="loginDropdown" role="button" data-bs-toggle="dropdown">
                  <span className="glyphicon glyphicon-log-in"></span> Bejelenkezés / Regisztráció
                  </a>
                  <ul className="dropdown-menu w-100">
                    <li><NavLink to="/login" className="dropdown-item">Bejelentkezés</NavLink></li>
                    <li><NavLink to="/registration" className="dropdown-item">Regisztráció</NavLink></li>
                  </ul>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <ProviderModal 
    isOpen={isProviderModalOpen}
    onClose={() => setIsProviderModalOpen(false)}
    onSuccess={() => {
      setIsProviderModalOpen(false);
      // You can add any success logic here, like showing a toast notification
    }}
  />
  </>
  );
};

export default NavigationBar;
