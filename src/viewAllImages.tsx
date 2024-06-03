import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const ViewAllImagesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log('Location state:', location.state);
    if (location.state && location.state.searchResults) {
      console.log('Search results:', location.state.searchResults);
      setThumbnails((location.state.searchResults || []).map(url => ({ thumbnailUrl: url, tags: [] })));
    } else {
      fetchThumbnails();
    }
  }, [location.state]);

  const fetchThumbnails = async () => {
    const userName = getUsernameFromToken();
    if (!userName) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/viewallimages?userName=${userName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch thumbnails');
      }
      const data = await response.json();
      const parsedBody = JSON.parse(data.body);
      console.log(parsedBody);
      setThumbnails(parsedBody.images.map(img => ({
        thumbnailUrl: img.thumbnailUrl,
        tags: img.tags || []
      })));
    } catch (err) {
      console.error('Error fetching thumbnails:', err);
      setError('Failed to load thumbnails.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUsernameFromToken = () => {
    const token = sessionStorage.getItem('idToken');
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload)['cognito:username'];
    }
    return null;
  };

  const handleCopy = (index) => {
    setCopied(true);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopied(false);
      setCopiedIndex(null);
    }, 2000);
  };

  const handleViewImage = async (thumbnailUrl) => {
    try {
      const idToken = sessionStorage.getItem('idToken');
      const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/viewimage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ thumbnailUrl })
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url;
        window.open(imageUrl, '_blank');
      } else {
        console.error('Error viewing image:', response.statusText);
        alert('Failed to view image.');
      }
    } catch (error) {
      console.error('Error during viewing image:', error);
      alert('An error occurred while viewing the image.');
    }
  };

  const handleSearch = async (event) => {
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
        if (result && result.links) {
            setThumbnails(result.links.map(url => ({ thumbnailUrl: url, tags: [] }))); // Assuming result.links are the URLs
            console.log('Search Results URLs:', result.links);
        } else {
            console.error('Invalid response format:', result);
            alert('Invalid response from the server.');
        }
    } catch (error) {
        console.error('Error during search:', error);
        alert('An error occurred while searching for images.');
    }
  };
  

  return (
    <div>
      <main>
        <section className="py-1 text-center container">
          <div className="row py-lg-5">
            <div className="col-lg-4 col-md-4 mx-auto">
              <h1 className="fw-light">Photo Gallery</h1>
            </div>
            <form onSubmit={handleSearch} className="mb-3">
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search for images by tag(s)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-outline-secondary" type="submit">Search</button>
              </div>
            </form>
          </div>
        </section>

        <div className="album py-5 bg-light">
          <div className="container">
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
              {isLoading ? (
                <p>Loading...</p>
              ) : error ? (
                <p>{error}</p>
              ) : Array.isArray(thumbnails) && thumbnails.length > 0 ? (
                thumbnails.map((image, index) => (
                  <div key={index} className="col">
                    <div className="card shadow-sm">
                      <img src={image.thumbnailUrl} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
                      <div className="card-body">
                        <p className="card-text">Tags: {image.tags.length > 0 ? image.tags.join(', ') : 'No tag identified'}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="btn-group">
                            <CopyToClipboard text={image.thumbnailUrl} onCopy={() => handleCopy(index)}>
                              <button type="button" className="btn btn-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
                                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                </svg>
                              </button>
                            </CopyToClipboard>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleViewImage(image.thumbnailUrl)}>View</button>
                          </div>

                          {copied && copiedIndex === index && <span style={{ color: 'green' }}>Copied!</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No thumbnails found.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewAllImagesPage;