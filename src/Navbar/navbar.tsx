import React, { useState } from "react";
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
    if (navbarCollapse && navbarCollapse.classList.contains("show")) {
      navbarCollapse.classList.remove("show");
    }
  };

  const handleAddProviderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProviderModalOpen(true);
    closeMenu();
  };

  return (
    <>
      <nav className="navbar navbar-expand-xl navbar-dark fixed-top">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            Saxon Kitchenware
          </Link>
          <button
            className="navbar-toggler mt-0 p-0"
            style={{ height: "40px", width: "40px" }}
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
            {/* Csak bejelentkezés után jelenik meg */}
            {isLoggedIn && (
              <ul className="navbar-nav me-auto">
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="aboutDropdown" role="button" data-bs-toggle="dropdown">
                    Megrendelesek Hozzaadasa
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <NavLink to="/addDelivery" className="dropdown-item" onClick={closeMenu}>
                        Kimeno Megrendeles
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/addOrder" className="dropdown-item" onClick={closeMenu}>
                        Bejovo Megrendeles
                      </NavLink>
                    </li>
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
                  <NavLink to="/orders" className="nav-link" onClick={closeMenu}>
                    Minden bejovo megrendeles
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/OutGoing" className="nav-link" onClick={closeMenu}>
                    Minden kimeno megrendeles
                  </NavLink>
                </li>
              </ul>
            )}

            <ul className="navbar-nav ms-auto">
              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <NavLink to="/Profile" className="nav-link" onClick={closeMenu}>
                      <span className="glyphicon glyphicon-user"></span> Profil
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-danger" onClick={() => {
                      logout();
                      closeMenu();
                    }}>
                      Kijelentkezés
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="loginDropdown" role="button" data-bs-toggle="dropdown">
                    <span className="glyphicon glyphicon-log-in"></span> Bejelentkezés / Regisztráció
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><NavLink to="/login" className="dropdown-item" onClick={closeMenu}>Bejelentkezés</NavLink></li>
                    <li><NavLink to="/registration" className="dropdown-item" onClick={closeMenu}>Regisztráció</NavLink></li>
                  </ul>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
      <ProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        onSuccess={() => {
          setIsProviderModalOpen(false);
        }}
      />
    </>
  );
};

export default NavigationBar;