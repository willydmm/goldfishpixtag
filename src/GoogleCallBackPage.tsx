import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fullUrl = window.location.href;
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');

    console.log('Complete URL:', fullUrl);
    console.log('Hash fragment:', hash);
    console.log('Parsed access token:', accessToken);
    console.log('Parsed ID token:', idToken);

    if (idToken && accessToken) {
      sessionStorage.setItem('idToken', idToken);  
      sessionStorage.setItem('accessToken', accessToken);
      console.log('Check idToken in sessionStorage:', sessionStorage.getItem('idToken'));
      console.log('Check accessToken in sessionStorage:', sessionStorage.getItem('accessToken'));
      window.location.href = '/home';
    } else {
      console.error('Google login failed: Access token or ID token not found');
      navigate('/login');
    }
  }, [navigate]);

  return <div>Loading...</div>;
};

export default GoogleCallbackPage;
