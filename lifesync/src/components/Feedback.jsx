import React, { useState } from "react";
import axios from "axios";
import "./styles.css";

const Feedback = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !dob || !subject || !feedback) return;

    try {
      await axios.post("http://localhost:5007/submit-feedback", {
        name,
        email,
        dob,
        subject,
        feedback,
      });
      setSuccessMsg("Thank you for your valuable feedback!");
      setName("");
      setEmail("");
      setDob("");
      setSubject("");
      setFeedback("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return (
    <div className="feedback-page fade-in">
      <h2 className="feedback-title">We’d Love Your Feedback</h2>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Name"
          className="feedback-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Your Email"
          className="feedback-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="date"
          placeholder="Date of Birth"
          className="feedback-input"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
        <input
          type="text"
          placeholder="Subject"
          className="feedback-input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          placeholder="Your Feedback"
          className="feedback-textarea"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        ></textarea>
        <button className="cta-btn" type="submit">
          Submit Feedback
        </button>
      </form>
      {successMsg && <p className="feedback-success">{successMsg}</p>}
    </div>
  );
};

export default Feedback;
