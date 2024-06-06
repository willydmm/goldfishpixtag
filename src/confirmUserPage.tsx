// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmSignUp } from './authService';

const ConfirmUserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // eslint-disable-next-line
  const [email, setEmail] = useState(location.state?.email || '');
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await confirmSignUp(email, confirmationCode);
      alert("Account confirmed successfully!\nSign in on next page.");
      navigate('/login');
    } catch (error) {
      alert(`Failed to confirm account: ${error}`);
    }
  };

return (
  <div>
      <header data-bs-theme="dark">
        <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1717/1717945.png"
            alt="GoldFishPixTag"
            height="60"
            className="bi me-2"
            style={{ paddingLeft: '20px', paddingRight: '5px' }}
          />
          <p style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>GoldfishPixTag</p>
        </div>
      </header>
  <div className="login">
    <h2>Confirm Account</h2>
    <img
          src="https://cdn-icons-png.flaticon.com/512/1717/1717945.png"
          alt="GoldFishPixTag"
          height="150"
          className="bi me-2"
          style={{ paddingLeft: '20px', paddingRight: '5px' }}
        />
    <form className='loginForm' onSubmit={handleSubmit}>
      <div>
        <input
          className="inputText form-control mb-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          className="inputText form-control mb-2"
          type="text"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
          placeholder="Confirmation Code"
          required />
      </div>
      <div className="spacer"></div>
      <button className="btn btn-primary mt-3" type="submit">Confirm Account</button>
    </form>
  </div>
  </div>
);

};

export default ConfirmUserPage;
