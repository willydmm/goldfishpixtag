import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './homePage.css';

function parseJwt(token: string) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const idToken = sessionStorage.getItem('idToken');
    if (idToken) {
      const parsedToken = parseJwt(idToken);
      setUserInfo(parsedToken);
      document.title = `Goldfish PixTag`;
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fileInput = document.getElementById('fileToUpload') as HTMLInputElement;
    if (!fileInput.files?.length) {
        alert('Please select a file to upload.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function () {
        if (typeof reader.result !== 'string') {
            console.error('Error: FileReader result is not a string.');
            alert('An error occurred while reading the file.');
            return;
        }

        console.log('File read successfully.');
        console.log('Sending request to API Gateway...');

        try {
            const base64Content = reader.result.split(',')[1]; // Remove the base64 prefix
            const idToken = sessionStorage.getItem('idToken'); // Retrieve idToken from sessionStorage

            const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'x-user-id': userInfo['cognito:username'], // Add user name as a header
                    'Authorization': `Bearer ${idToken}` // Add authorization token
                },
                body: base64Content
            });

            console.log('Received response from API Gateway.');
            const result = await response.json();
            alert(result);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while uploading the image.');
        }
    };

    reader.onerror = function () {
        console.error('Error reading file:', reader.error);
        alert('Failed to read file.');
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="homepage">
      {userInfo && <h1>Welcome, {userInfo.email}</h1>}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      <form onSubmit={handleUpload} id="uploadForm" className="upload-form">
        <input type="file" name="fileToUpload" id="fileToUpload" />
        <button type="submit">Upload Image</button>
      </form>
      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
};

export default HomePage;
