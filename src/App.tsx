// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import GoogleCallbackPage from './GoogleCallBackPage';
import QueryByImagePage from './QueryByImagePage.tsx';
import ViewFullImage from './ViewFullImage.tsx';
import ConfirmUserPage from './confirmUserPage';
import DeletePage from './deletePage';
import HomePage from './homePage.tsx';
import Layout from './layout.tsx';
import LoginPage from './loginPage';


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
        <Route path="/delete" element={isAuthenticated() ? <Layout><DeletePage /></Layout>: <Navigate replace to="/login" />} />
        <Route path="/querybyimage" element={isAuthenticated() ? <Layout><QueryByImagePage /></Layout>: <Navigate replace to="/login" />} />
        <Route path="/viewfullimage" element={isAuthenticated() ? <Layout><ViewFullImage /></Layout>: <Navigate replace to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
