import React from "react";
import { Link, NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./navbar.css";

const NavigationBar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">
          GROUP.COM
        </Link>
        <button
          className="navbar-toggler"
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
              <NavLink to="/contact" className="nav-link">Contact Us</NavLink>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink to="/profile" className="nav-link">
                <span className="glyphicon glyphicon-user"></span> Profile
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="loginDropdown" role="button" data-bs-toggle="dropdown">
                <span className="glyphicon glyphicon-log-in"></span> Login / Sign Up
              </a>
              <ul className="dropdown-menu">
                <li><NavLink to="/login" className="dropdown-item">Login</NavLink></li>
                <li><NavLink to="/registration" className="dropdown-item">Sign Up</NavLink></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
