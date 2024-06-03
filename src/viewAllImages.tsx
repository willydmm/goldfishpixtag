import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useNavigate } from 'react-router-dom';
import './homePage.css';

function parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

const ViewAllImagesPage: React.FC = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

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


    // Query by tags
    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

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
            console.log(idToken)

            const result = await response.json();
            console.log("search response", result)

            if (result.images) {
                const searchResultsWithPresignedUrls = await Promise.all(result.images.map(async image => {
                    const presignedUrl = await getPresignedUrl(image.thumbnailUrl);
                    return {
                        ...image,
                        presignedUrl,
                        tags: JSON.parse(image.tags)  // Parsing the tags string into an array
                    };
                }));
    
                setSearchResults(searchResultsWithPresignedUrls);
                console.log("search result", searchResults)
            } else {
                setSearchResults([]);  // No images found
                console.log("failed")
            }


        } catch (error) {
            console.error('Error during search:', error);
            alert('An error occurred while searching for images.');
        }
    };

    // Upload image 
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

    // Navigate to delete image page 
    const handleDeleteByUrl = () => {
        navigate('/delete');
    };

    // Fetch username to display only images of current user
    const getUsernameFromToken = () => {
        const token = sessionStorage.getItem('idToken');
        if (token) {
            const base64Url = token.split('.')[1]; // Get the payload part
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload)['cognito:username']; // Adjust based on the actual key where username is stored
        }
        return null;
    };
    const userName = getUsernameFromToken();

    // Display all images by fetching thumbnails and their presigned url
    useEffect(() => {
        if (userName) {
            const fetchThumbnails = async () => {
                setIsLoading(true);
                setError('');
                try {
                    // Fetch user images
                    const response = await fetch(`https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/viewallimages?userName=${userName}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch thumbnails');
                    }
                    const data = await response.json();
                    console.log(data)
                    const parsedBody = JSON.parse(data.body);
                    // console.log(parsedBody)
                    // Fetch presigned URLs for each thumbnail and include tags
                    const thumbnailsWithPresignedUrls = await Promise.all(parsedBody.images.map(async (image) => {
                        const presignedUrl = await getPresignedUrl(image.thumbnailUrl);
                        return {
                            ...image,  // Original propert8ies
                            presignedUrl  // Add the new presigned URL
                        };
                    }));

                    setThumbnails(thumbnailsWithPresignedUrls);
                } catch (err) {
                    console.error('Error fetching thumbnails:', err);
                    setError('Failed to load thumbnails.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchThumbnails();
        }
    }, [userName]);

    // console.log("thumbnails", thumbnails)

    // Copy image url
    const handleCopy = (index) => {
        setCopied(true);
        setCopiedIndex(index);
        setTimeout(() => {
            setCopied(false);
            setCopiedIndex(null);
        }, 2000);
    };


    const handleViewImage = async (thumbnailUrl) => {
        // Parse thumbnail url to image url 
        console.log(thumbnailUrl)
        const baseUrl = thumbnailUrl.replace("_thumbnail", "").replace("goldfishthumbnails", "goldfishimages");
        console.log(baseUrl)
        // Fetch presigned url for full image
        const fullImageUrl = await getPresignedUrl(baseUrl);
        // Navigate to new page to display image
        navigate('/viewfullimage', { state: { imageUrl: fullImageUrl } });
    };


    const getPresignedUrl = async (imageUrl) => {
        try {
            const response = await fetch(`https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/presigned_url?url=${imageUrl}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
            }
            const data = await response.json();
            // console.log("Presigned URL:", data.presigned_url);
            return data.presigned_url;
        } catch (error) {
            console.error('Error fetching presigned URL:', error);
            return imageUrl;
        }
    };

    if (!userName) return <p>Please log in to view images.</p>;
    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;


    return (
        <div>
            <main>
                <section className="py-1 text-center container">
                    <div className="row py-lg-5">
                        <div className="col-lg-4 col-md-4 mx-auto">
                            {userInfo && <h1>Welcome, {userInfo.given_name}</h1>}
                        </div>
                        {/* upload */}
                        <form onSubmit={handleUpload} className="mb-3">
                            <div className="input-group mb-3">
                                <input type="file" name="fileToUpload" id="fileToUpload" className="form-control" />
                                <button type="submit" className="btn btn-primary mt-2">Upload</button>
                            </div>
                        </form>
                        {/* search */}
                        <form onSubmit={handleSearch} className="mb-3">
                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search for images..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="btn btn-primary mt-2" type="submit">Search</button>
                            </div>
                        </form>
                        <div className="btn-group" role="group" aria-label="Basic example">
                            <button /*onClick={}*/ className="btn btn-secondary">Find Similar Image</button>
                            <button onClick={handleDeleteByUrl} className="btn btn-danger">Delete Images by Url</button>
                        </div>
                    </div>
                </section>


                {/* image display */}
                <div className="album py-5 bg-light">
                    <div className="container">
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                            {((searchResults.length > 0 ? searchResults : thumbnails).map((image, index) => (
                                <div key={index} className="col">
                                    <div className="card shadow-sm">
                                        <img src={image.presignedUrl} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
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
                                                    {/* View full image button */}
                                                    <button type="button" className="btn btn-secondary" onClick={() => handleViewImage(image.thumbnailUrl)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {copied && copiedIndex === index && <span style={{ color: 'green' }}>Copied!</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewAllImagesPage;