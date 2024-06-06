import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useNavigate } from 'react-router-dom';



const QueryByImagePage = () => {
    const navigate = useNavigate();
    const [imageFile, setImageFile] = useState(null);
    const [imageResults, setImageResults] = useState([]);
    const [copied, setCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false);

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

    const handleImageChange = (event) => {
        setImageFile(event.target.files[0]);
    };

    const handleSubmitImage = async (event: React.FormEvent<HTMLFormElement>) => {
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
    
                const response = await fetch('https://2l4hsonf2h.execute-api.us-east-1.amazonaws.com/prod/query_by_image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Authorization': `Bearer ${idToken}`,
                        'Userid': userName // Add authorization token
                    },
                    body: base64Content
                });
                const result = await response.json();
                console.log('Received response from API Gateway.', result);
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
        
                    setImageResults(searchResultsWithPresignedUrls);
                    console.log("search result", searchResultsWithPresignedUrls)
                } else {
                    setImageResults([]);  // No images found
                    console.log("No images found")
                }
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


    return (
        <div>
            <section className="py-3 px-5 text-center container">
                <div className="row py-lg-5 px-5">
                    <div className="col-lg-4 col-md-4 mx-auto">
                        <h2>Search for Similar Images</h2>
                    </div>
                    <div className='spacer'></div>
                    {/* upload */}
                    <form onSubmit={handleSubmitImage} className="upload mb-3">
                        <div className="input-group mb-3">
                            <input type="file" name="fileToUpload" id="fileToUpload" accept="image/*" className="form-control" />
                            <button type="submit" className="btn btn-primary">Search</button>
                        </div>
                    </form>
                    </div>
            </section>

            <div className="album py-3" style={{ marginBottom: '100px' }}>
                <h3>Matching Images</h3>
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 images">
                    {Array.isArray(imageResults) && imageResults.length > 0 ? (
                        imageResults.map((image, index) => (
                            <div key={index} className="col image-card">
                                <div className="card shadow-sm">
                                    <img src={image.presignedUrl} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
                                </div>
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
                        ))
                    ) : (
                        searchPerformed && <p>No similar images found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueryByImagePage;