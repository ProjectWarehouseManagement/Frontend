import React, { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./navbar.css";

const NavigationBar = () => {
  const location = useLocation();
  
  // Menü bezárása kattintáskor
  const closeMenu = () => {
    const navbarCollapse = document.querySelector(".navbar-collapse") as HTMLElement;
    if (navbarCollapse.classList.contains("show")) {
      navbarCollapse.classList.remove("show");
    }
  };

  // Ha az URL változik, automatikusan bezárja a menüt
  useEffect(() => {
    closeMenu();
  }, [location]);
  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">
          Warehouse Management
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
                About Us
              </a>
              <ul className="dropdown-menu">
                <li><NavLink to="/about-one" className="dropdown-item">About One</NavLink></li>
                <li><NavLink to="/about-two" className="dropdown-item">About Two</NavLink></li>
                <li><NavLink to="/about-three" className="dropdown-item">About Three</NavLink></li>
                <li><NavLink to="/about-four" className="dropdown-item">About Four</NavLink></li>
                <li><NavLink to="/about-five" className="dropdown-item">About Five</NavLink></li>
                <li><NavLink to="/about-six" className="dropdown-item">About Six</NavLink></li>
              </ul>
            </li>
            <li className="nav-item">
              <NavLink to="/welcome" className="nav-link">Welcome</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/services" className="nav-link">Services</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/gallery" className="nav-link">Gallery</NavLink>
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
              <a className="nav-link dropdown-toggle" href="#" id="loginDropdown" role="button" data-bs-toggle="dropdown">
                <span className="glyphicon glyphicon-log-in"></span> Bejelenkezés / Regisztráció
              </a>
              <ul className="dropdown-menu w-100">
                <li><NavLink to="/login" className="dropdown-item">Bejelentkezés</NavLink></li>
                <li><NavLink to="/registration" className="dropdown-item">Regisztráció</NavLink></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
