// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import GoogleCallbackPage from './GoogleCallBackPage';
import ViewFullImage from './ViewFullImage.tsx';
import ConfirmUserPage from './confirmUserPage';
import DeletePage from './deletePage';
import HomePage from './homePage';
import Layout from './layout.tsx';
import LoginPage from './loginPage';
import ViewAllImages from './viewAllImages.tsx';


const App: React.FC = () => {
  const isAuthenticated = () => {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated() ? <Navigate replace to="/home" /> : <Navigate replace to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirm" element={<ConfirmUserPage />} />
        <Route path="/home" element={isAuthenticated() ? <Layout><HomePage /></Layout> : <Navigate replace to="/login" />} />
        <Route path="/google-callback" element={<GoogleCallbackPage />} />
        <Route path="/delete" element={<Layout><DeletePage /></Layout>} />
        <Route path="/viewallimages" element={<Layout><ViewAllImages /></Layout>} />
        <Route path="/viewfullimage" element={<Layout><ViewFullImage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
