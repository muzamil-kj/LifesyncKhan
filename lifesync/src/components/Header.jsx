import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import "font-awesome/css/font-awesome.min.css";
import "./styles.css";
import logo from "../assets/logoimg.png";

const Header = () => {
  const [activeSection, setActiveSection] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerHeight =
        document.querySelector(".custom-header").offsetHeight;
      window.scrollTo({
        top: element.offsetTop - headerHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (
      location.pathname === "/" ||
      location.pathname === "/login" ||
      location.pathname === "/signup" ||
      location.pathname === "/faqs" ||
      location.pathname === "/dashboard" ||
      location.pathname === "/dashboard/chatbot" ||
      location.pathname === "/dashboard/profile" ||
      location.pathname === "/dashboard/journal" ||
      location.pathname === "/dashboard/wellness" ||
      location.pathname === "/dashboard/timecapsule" ||
      location.pathname === "/dashboard/report" ||
      location.pathname === "/dashboard/systemlogs"
    ) {
      setActiveSection("");
    }

    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.2 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [location]);

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      const sectionId = location.hash.substring(1);
      if (sectionId) {
        scrollToSection(sectionId);
      }
    }
  }, [location]);

  const handleNavLinkClick = (e, sectionId) => {
    e.preventDefault();
    if (
      location.pathname === "/signup" ||
      location.pathname === "/login" ||
      location.pathname === "/faqs" ||
      location.pathname === "/dashboard" ||
      location.pathname === "/dashboard/chatbot" ||
      location.pathname === "/dashboard/journal" ||
      location.pathname === "/dashboard/wellness" ||
      location.pathname === "/dashboard/profile" ||
      location.pathname === "/dashboard/timecapsule" ||
      location.pathname === "/dashboard/report" ||
      location.pathname === "/dashboard/systemlogs"
    ) {
      navigate("/");
      window.location.hash = sectionId;
    } else {
      scrollToSection(sectionId);
    }
  };

  // 👉 New: Handle logo click to always go to homepage
  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="custom-header">
      <div className="container">
        <div className="logo" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          <img src={logo} alt="LifeSync Logo" />
          <h1>LifeSync</h1>
        </div>
        <input type="checkbox" id="menu-toggle" className="hidden-checkbox" />
        <label htmlFor="menu-toggle" className="menu-toggle"></label>

        <nav className="navbar">
          <ul className="nav-links">
            <li>
              <Link
                to="#about"
                onClick={(e) => handleNavLinkClick(e, "about")}
                className={`nav-link ${activeSection === "about" ? "active" : ""}`}
              >
                <i className="fa fa-info-circle"></i> About
              </Link>
            </li>
            <li>
              <Link
                to="#whychoose"
                onClick={(e) => handleNavLinkClick(e, "whychoose")}
                className={`nav-link ${activeSection === "whychoose" ? "active" : ""}`}
              >
                <i className="fa fa-check-circle"></i> Why Choose Us
              </Link>
            </li>
            <li>
              <Link
                to="#services"
                onClick={(e) => handleNavLinkClick(e, "services")}
                className={`nav-link ${activeSection === "services" ? "active" : ""}`}
              >
                <i className="fa fa-cogs"></i> Services
              </Link>
            </li>
          </ul>
        </nav>
        <button onClick={() => navigate("/faqs")} className="faq-button">
          Go to FAQs
        </button>
      </div>
    </header>
  );
};

export default Header;
