import React, { useState } from "react";

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  const styles = {
    container: {
      maxWidth: "600px",
      margin: "80px auto",
      backgroundColor: "#fff",
      padding: "2.5rem",
      borderRadius: "16px",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
      transition: "all 0.3s ease",
      textAlign: "center",
    },
    title: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#222",
      marginBottom: "2rem",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem",
      textAlign: "left",
    },
    group: {
      display: "flex",
      flexDirection: "column",
    },
    label: {
      fontWeight: "600",
      color: "#333",
      marginBottom: "0.5rem",
    },
    input: {
      width: "100%",
      padding: "0.9rem 1rem",
      border: "2px solid #ccc",
      borderRadius: "12px",
      fontSize: "1rem",
      outline: "none",
      backgroundColor: "#fafafa",
      transition: "all 0.3s ease",
    },
    textarea: {
      width: "100%",
      padding: "0.9rem 1rem",
      border: "2px solid #ccc",
      borderRadius: "12px",
      fontSize: "1rem",
      outline: "none",
      backgroundColor: "#fafafa",
      transition: "all 0.3s ease",
      resize: "none",
    },
    button: {
      backgroundColor: "#efbd48",
      color: "#000",
      fontWeight: "600",
      padding: "0.9rem 1.5rem",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      fontSize: "1rem",
      alignSelf: "center",
      width: "100%",
      transition: "all 0.3s ease",
    },
    thankBox: {
      textAlign: "center",
      padding: "3rem 2rem",
      backgroundColor: "#fdf9f1",
      border: "2px solid #efbd48",
      borderRadius: "16px",
      boxShadow: "0 4px 8px rgba(239, 189, 72, 0.2)",
    },
    thankTitle: {
      color: "#333",
      fontSize: "1.5rem",
      marginBottom: "0.8rem",
    },
    thankText: {
      color: "#555",
      fontSize: "1rem",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Contact Us</h2>

      {!submitted ? (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#efbd48")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              style={styles.input}
              onFocus={(e) => (e.target.style.borderColor = "#efbd48")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your message"
              rows="5"
              required
              style={styles.textarea}
              onFocus={(e) => (e.target.style.borderColor = "#efbd48")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#e1ad3f")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#efbd48")}
          >
            Send Message
          </button>
        </form>
      ) : (
        <div style={styles.thankBox}>
          <h3 style={styles.thankTitle}>Thank you for reaching out!</h3>
          <p style={styles.thankText}>We’ll get back to you soon. 💬</p>
        </div>
      )}
    </div>
  );
};

export default ContactForm;
