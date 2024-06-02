/*
  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const idToken = sessionStorage.getItem('idToken');
      const tagsWithCounts = searchQuery.split(',').map(tag => tag.trim());

      const tags = tagsWithCounts.reduce((acc, tagCount) => {
        const match = tagCount.match(/^(.*)\s(\d+)$/);
        if (match) {
          const [, tag, count] = match;
          acc[tag.trim()] = parseInt(count, 10);
        } else {
          acc[tagCount.trim()] = 1;
        }
        console.log(acc);
        return acc;
      }, {});
      

      const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/query_by_tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ tags })
      });

      const result = await response.json();
      setSearchResults(result.links);
      // Log the list of URLs to the console
      console.log('Search Results URLs:', result.links);
    } catch (error) {
      console.error('Error during search:', error);
      alert('An error occurred while searching for images.');
    }
  };
  */

  import React, { useEffect, useState } from 'react';
  import { useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const [userInfo, setUserInfo] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
  
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
  
    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
  
      try {
        const idToken = sessionStorage.getItem('idToken');
        const tagsWithCounts = searchQuery.split(',').map(tag => tag.trim());
  
        const tags = tagsWithCounts.reduce((acc, tagCount) => {
          const match = tagCount.match(/^(.*)\s(\d+)$/);
          if (match) {
            const [, tag, count] = match;
            acc[tag.trim()] = parseInt(count, 10);
          } else {
            acc[tagCount.trim()] = 1;
          }
          console.log(acc);
          return acc;
        }, {});

        const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/query_by_tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ tags })
        });
  
        const result = await response.json();
        setSearchResults(result.links);
        // Log the list of URLs to the console
        console.log('Search Results URLs:', result.links);
        navigate('/searchresults', { state: { links: result.links } });
      } catch (error) {
        console.error('Error during search:', error);
        alert('An error occurred while searching for images.');
      }
    };
  
    const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
  
      const fileInput = document.getElementById('fileToUpload') as HTMLInputElement;
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
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
          const base64Content = reader.result.split(',')[1];
          const idToken = sessionStorage.getItem('idToken');
  
          const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'x-user-id': userInfo['cognito:username'],
              'Authorization': `Bearer ${idToken}`
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
  
    const handleDelete = () => {
      navigate('/delete');
    };
  
    const handleViewAllImages = () => {
      navigate('/viewallimages');
    };
  
    return (
      <div id="homepage">
        {userInfo && <h1>Welcome, {userInfo.given_name}</h1>}
        <form onSubmit={handleSearch} className="mb-3">
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search for images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-outline-secondary" type="submit">Search</button>
          </div>
        </form>
        {searchResults.length > 0 ? (
          <div className="search-results">
            <h2>Search Results:</h2>
            <ul className="list-unstyled">
              {searchResults.map((url, index) => (
                <li key={index}>
                  <img src={url} alt={`Thumbnail ${index}`} className="img-thumbnail" />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No search results found.</p>
        )}
        <form onSubmit={handleUpload}>
          <div className="mb-3">
            <label htmlFor="fileToUpload" className="form-label">Upload an image</label>
            <input className="form-control" type="file" id="fileToUpload" />
          </div>
          <button type="submit" className="btn btn-primary">Upload</button>
        </form>
        <button className="btn btn-secondary" onClick={handleDelete}>Delete</button>
        <button className="btn btn-secondary" onClick={handleViewAllImages}>View All Images</button>
        <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
      </div>
    );
  };
  
  export default HomePage;
  