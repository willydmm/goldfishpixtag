import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useNavigate } from 'react-router-dom';

const DeletePage = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [thumbnailUrls, setThumbnailUrls] = useState([]);
    const [presignedUrls, setPresignedUrls] = useState({});
    const [copied, setCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
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
            return data.presigned_url;
        } catch (error) {
            console.error('Error fetching presigned URL:', error);
            return imageUrl;
        }
    };

    const handleAddThumbnails = async () => {
        if (inputValue === '') {
            alert('Please enter at least one image URL to delete.');
            return;
        }
        const urls = inputValue.split('\n').map(url => url.trim()).filter(url => url);
        setThumbnailUrls(urls);
        setInputValue(''); // Clear input field after adding

        // Fetch presigned URLs for each thumbnail URL
        const urlsWithPresignedUrls = {};
        for (let url of urls) {
            const presignedUrl = await getPresignedUrl(url);
            urlsWithPresignedUrls[url] = presignedUrl;
        }
        setPresignedUrls(urlsWithPresignedUrls);
    };

    const handleDeleteConfirmation = async () => {
        if (thumbnailUrls.length === 0) {
            alert('Please enter at least one image URL to delete.');
            return;
        }
        if (window.confirm('Are you sure you want to delete all the displayed images?')) {
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
                setThumbnailUrls([]); // Clear the thumbnails list after successful deletion
                navigate('/'); // Redirect or refresh the page
            } else {
                const errMsg = await response.text();
                alert(`Failed to delete images: ${errMsg}`);
            }
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    const handleCopy = (index, url) => {
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

    return (
        <div className='topic'>
            <h2>Delete Images</h2>
            <textarea
                className='mb-3'
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter image URLs separated by new lines to delete"
                rows={5}
            />
            <button className="btn btn-warning mb-0 mt-2" onClick={handleAddThumbnails}>Batch Delete</button>
            <br></br>
            {thumbnailUrls.length > 0 && <h5 style={{ fontStyle: 'italic' }}>Are you sure you want to delete all images?</h5>}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 mt-2 images">
                {thumbnailUrls.map((url, index) => (
                    <div key={index} className="col image-card">
                        <div className="card shadow-sm">
                            <img src={presignedUrls[url] || url} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
                        </div>
                        <div className="card-body mt-1">
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <div className="btn-group">
                                    <CopyToClipboard text={url} onCopy={() => handleCopy(index, url)}>
                                        <button type="button" className="btn btn-secondary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
                                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                                            </svg>
                                        </button>
                                    </CopyToClipboard>
                                    <button type="button" className="btn btn-secondary mx-1" onClick={() => handleViewImage(url)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
                                        </svg>
                                    </button>
                                    {copied && copiedIndex === index && <span style={{ color: 'green' }}>Copied!</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className='mt-1 mb-5'>
                {thumbnailUrls.length > 0 && <button className="btn btn-danger" onClick={handleDeleteConfirmation}>Confirm Delete</button>}
                <button className="btn btn-secondary mx-3" onClick={handleCancel}>Cancel</button>
            </div>
        </div>
    );
};

export default DeletePage;
