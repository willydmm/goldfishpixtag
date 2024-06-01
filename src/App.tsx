// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import GoogleCallbackPage from './GoogleCallBackPage';
import ConfirmUserPage from './confirmUserPage';
import DeletePage from './deletePage';
import HomePage from './homePage';
import LoginPage from './loginPage';
import SearchResultsPage from './searchResultsPage.tsx';
import ViewAllImages from './viewAllImages.tsx';

const App = () => {
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
        <Route path="/home" element={isAuthenticated() ? <HomePage /> : <Navigate replace to="/login" />} />
        <Route path="/google-callback" element={<GoogleCallbackPage />} />
        <Route path="/searchresults" element={<SearchResultsPage />} />
        <Route path="/delete" element={<DeletePage />} />
        <Route path="/viewallimages" element={<ViewAllImages />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
