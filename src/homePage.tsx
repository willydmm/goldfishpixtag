import React, { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useNavigate } from 'react-router-dom';

function parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [selectedImages, setSelectedImages] = useState({});
    const [searchPerformed, setSearchPerformed] = useState(false);

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

    const toggleImageSelection = (imageUrl) => {
        setSelectedImages(prev => ({
            ...prev,
            [imageUrl]: !prev[imageUrl]
        }));
    };

    const isImageSelected = (imageUrl) => {
        return !!selectedImages[imageUrl];
    };

    const toggleSelectAll = () => {
        if (Object.keys(selectedImages).length === thumbnails.length && Object.values(selectedImages).every(val => val)) {
            // All are currently selected, so unselect all
            setSelectedImages({});
        } else {
            // Not all are selected, so select all
            const newSelectedImages = {};
            thumbnails.forEach(image => {
                newSelectedImages[image.thumbnailUrl] = true;
            });
            setSelectedImages(newSelectedImages);
        }
    };

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
                return acc;
            }, {});
    
            const response = await fetch('https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/query_by_tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ tags })
            });
    
            const result = await response.json();
            console.log("search response", result)
            setSearchPerformed(true);
    
            if (result.links) {
                const searchResultsWithPresignedUrls = await Promise.all(result.links.map(async (link, index) => {
                    const presignedUrl = await getPresignedUrl(link);
                    return {
                        thumbnailUrl: link,
                        presignedUrl,
                        tags: JSON.parse(result.tags[index])  // Parsing tags from the response
                    };
                }));
    
                setSearchResults(searchResultsWithPresignedUrls);
                console.log("search result", searchResultsWithPresignedUrls)
            } else {
                setSearchResults([]);  // No images found
                console.log("No images found")
            }
        } catch (error) {
            console.error('Error during search:', error);
            alert('An error occurred while searching for images.');
        } finally {
            setIsLoading(false);
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
                const response = await fetch('https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/upload', {
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
                window.location.reload(); // Refresh the page after upload
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

    // Navigate to delete image page 
    const handleQueryByImage = () => {
        navigate('/querybyimage');
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

            return JSON.parse(jsonPayload)['cognito:username']; 
        }
        return null;
    };
    const userName = getUsernameFromToken();

    //Display all images by fetching thumbnails and their presigned url
    useEffect(() => {
        if (userName) {
            const fetchThumbnails = async () => {
                setIsLoading(true);
                setError('');
                try {
                    // Fetch user images
                    const response = await fetch(`https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/viewallimages?userName=${userName}`,{
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                        }
                    });
                    //console.log("response", response)
                    if (!response.ok) {
                        throw new Error('Failed to fetch thumbnails');
                    }
                    const parsedBody = await response.json();
                    //console.log("data",data)
                    // const parsedBody = JSON.parse(data.body);
                    console.log("parsed body", parsedBody)
                    // Fetch presigned URLs for each thumbnail and include tags
                    const thumbnailsWithPresignedUrls = await Promise.all(parsedBody.images.map(async (image) => {
                        const presignedUrl = await getPresignedUrl(image.thumbnailUrl);
                        return {
                            ...image,  // Original properties
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

    // View original image 
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
            const response = await fetch(`https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/presigned_url?url=${imageUrl}`, {
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

    const [tagInput, setTagInput] = useState('');
    const [showAddTagModal, setShowAddTagModal] = useState(false);
    const [showDeleteTagModal, setShowDeleteTagModal] = useState(false);

    const handleAddTag = async () => {
        const tagsToAdd = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const selectedUrls = Object.keys(selectedImages).filter(url => selectedImages[url]);
    
        console.log('Adding tags', tagsToAdd, 'to images', selectedUrls);
    
        if (tagsToAdd.length === 0 || selectedUrls.length === 0) {
            alert('Please select images and enter tags to add.');
            return;
        }
    
        try {
            const response = await fetch('https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/add_delete_tag', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                },
                body: JSON.stringify({
                    url: selectedUrls,
                    // 1 for add
                    type: 1,  
                    tags: tagsToAdd
                })
            });
    
            if (!response.ok) throw new Error('Failed to add tags');
    
            const result = await response.json();
            alert('Tags added successfully!');
            window.location.reload(); // Refresh the page after upload
            console.log(result);
    
            // Clear selections and close modal
            setTagInput('');
            setSelectedImages({});
            setShowAddTagModal(false);
    
        } catch (error) {
            console.error('Error adding tags:', error);
            alert(`Error: ${error.message}`);
        }
    };
    

    const handleDeleteTag = async () => {
        const tagsToRemove = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const selectedUrls = Object.keys(selectedImages).filter(url => selectedImages[url]);
    
        console.log('Removing tags', tagsToRemove, 'from images', selectedUrls);
    
        if (tagsToRemove.length === 0 || selectedUrls.length === 0) {
            alert('Please select images and enter tags to remove.');
            return;
        }
    
        try {
            const response = await fetch('https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/add_delete_tag', {  
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                },
                body: JSON.stringify({
                    url: selectedUrls,
                    // 0 for remove
                    type: 0,  
                    tags: tagsToRemove
                })
            });
    
            if (!response.ok) throw new Error('Failed to remove tags');
    
            const result = await response.json();
            alert('Tags removed successfully!');
            window.location.reload(); // Refresh the page after upload
            console.log(result); 
    
            // Clear selections and close modal
            setTagInput('');
            setSelectedImages({});
            setShowAddTagModal(false);
    
        } catch (error) {
            console.error('Error removing tags:', error);
            alert(`Error: ${error.message}`);
        }
    };
    

    const handleBatchDelete = async (urls) => {
        const thumbnailUrls = Object.keys(selectedImages).filter(url => selectedImages[url]);
        console.log('Deleting images:', thumbnailUrls);
        if (window.confirm(`Are you sure you want to delete selected ${thumbnailUrls.length} images?`)) {
            // Delete selected images if confirmed      
            const response = await fetch('https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                },
                body: JSON.stringify({ thumbnailUrls })
            });

            if (response.ok) {
                alert('Images deleted successfully.');
                window.location.reload(); // Refresh the page after upload
            } else {
                const errMsg = await response.text();
                alert(`Failed to delete images: ${errMsg}`);
            }
        }
        setSelectedImages({});
    };



    return (
        <div>
            <main>
                <section className="py-3 px-5 text-center container">
                    <div className="row py-lg-5 px-5">
                        <div className="col-lg-4 col-md-4 mx-auto">
                            {userInfo && <h2>Welcome, {userInfo.given_name}</h2>}
                        </div>
                        <div className='spacer'></div>
                        {/* upload */}
                        <form onSubmit={handleUpload} className="upload mb-3">
                            <div className="input-group mb-3">
                                <input type="file" name="fileToUpload" id="fileToUpload" accept="image/*" className="form-control" />
                                <button type="submit" className="btn btn-primary">Upload</button>
                            </div>
                        </form>
                        {/* search */}
                        {/* <form onSubmit={handleSearch} className="mb-3">
                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search for images..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="btn btn-primary" type="submit">Search</button>
                            </div>
                        </form> */}
                        <div >
                            <button onClick={handleQueryByImage} className="btn btn-secondary mx-5">Find Similar Image</button>
                            <button onClick={handleDeleteByUrl} className="btn btn-secondary mx-5">Delete Images by Url</button>
                        </div>
                    </div>
                </section>


                {/* image display */}
                <div className="album py-3" style={{ marginBottom: '100px' }}>

                    <div className="container gallery">
                    <div className="controls">
                        <div className="select-all">
                            <input
                                type="checkbox"
                                id="select-all"
                                checked={Object.keys(selectedImages).length === thumbnails.length && Object.values(selectedImages).every(val => val)}
                                onChange={toggleSelectAll}
                                className="select-all-checkbox"
                            />
                            <label htmlFor="select-all">Select All</label>
                        </div>
                        <div className="btn-group mx-2" role="group">
                        <button className="btn btn-primary mx-1" onClick={() => setShowAddTagModal(true)}>Add Tag</button>
                        <button className="btn btn-warning mx-1" onClick={() => setShowDeleteTagModal(true)}>Delete Tag</button>
                        <button className="btn btn-danger mx-1" onClick={handleBatchDelete}>Delete Images</button>
                        </div>
                            <form onSubmit={handleSearch} className="form-inline">
                            <div className="input-group mx-5">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search for images..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="btn btn-outline-primary" type="submit">Search</button>
                                <button className="btn btn-outline-primary" onClick={() => setSearchQuery("")}>Clear</button>
                            </div>
                        </form>
                    </div>

                    {/* Thumbnails or Search Results */}
    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 images">
    {isLoading ? (
        <p className="centered-message">Loading...</p>
    ) : error ? (
        <p className="centered-message">{error}</p>
    ) : searchResults.length > 0 ? (
            // Display search results if available
            searchResults.map((image, index) => (
                <div key={index} className="col image-card">
                    <div className="card shadow-sm">
                        <img src={image.presignedUrl} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={isImageSelected(image.thumbnailUrl)}
                                onChange={() => toggleImageSelection(image.thumbnailUrl)}
                                className="image-checkbox"
                            />
                        </div>
                    </div>
                    <div className="card-body mt-1">
                        <p className="card-text">Tags: {image.tags.length > 0 ? image.tags.join(', ') : 'No tag identified'}</p>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <div className="btn-group">
                                {/* Copy thumbnail url button */}
                                <CopyToClipboard text={image.thumbnailUrl} onCopy={() => handleCopy(index)}>
                                    <button type="button" className="btn btn-secondary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                        </svg>
                                    </button>
                                </CopyToClipboard>
                                {/* View full image button */}
                                <button type="button" className="btn btn-secondary mx-1" onClick={() => handleViewImage(image.thumbnailUrl)}>
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
            ))
        ) : searchPerformed && searchQuery && searchResults.length === 0 ? (
            // Display "Not Found" message if search query is present but no results
            <div className="col text-center">
                <p>No images found with tag '{searchQuery}'</p>
            </div>
        ) : (
            // Display thumbnails if no search is performed or search query is cleared
            thumbnails.map((image, index) => (
                <div key={index} className="col image-card">
                    <div className="card shadow-sm">
                        <img src={image.presignedUrl} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
                        <div className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={isImageSelected(image.thumbnailUrl)}
                                onChange={() => toggleImageSelection(image.thumbnailUrl)}
                                className="image-checkbox"
                            />
                        </div>
                    </div>
                    <div className="card-body mt-1">
                        <p className="card-text">Tags: {image.tags.length > 0 ? image.tags.join(', ') : 'No tag identified'}</p>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <div className="btn-group">
                                {/* Copy thumbnail url button */}
                                <CopyToClipboard text={image.thumbnailUrl} onCopy={() => handleCopy(index)}>
                                    <button type="button" className="btn btn-secondary">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                        </svg>
                                    </button>
                                </CopyToClipboard>
                                {/* View full image button */}
                                <button type="button" className="btn btn-secondary mx-1" onClick={() => handleViewImage(image.thumbnailUrl)}>
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
            ))
        )}
    </div>


                    





                    </div>
                </div>




            </main >
            {/* AddTag Modal */}
            {showAddTagModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowAddTagModal(false)}>&times;</span>
                        <h4>Add Tags to Images</h4>
                        <input
                            className='taginput'
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Enter tags to add, separated by commas"
                        />
                        <button className='btn btn primary' onClick={handleAddTag}>Add Tags</button>
                    </div>
                </div>
            )}
            {/* DeleteTag Modal */}
            {showDeleteTagModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowDeleteTagModal(false)}>&times;</span>
                        <h4>Delete Tags from Images</h4>
                        <input
                            className='taginput'
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Enter tags to delete, separated by commas"
                        />
                        <button className='btn btn-primary' onClick={handleDeleteTag}>Delete Tags</button>
                    </div>
                </div>
            )}
        </div >
    );
};

export default HomePage;