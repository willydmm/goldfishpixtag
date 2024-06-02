import { useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const ViewAllImagesPage = () => {
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [copied, setCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);  // To track which URL was copied



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
    useEffect(() => {
        if (userName) {
            const fetchThumbnails = async () => {
                setIsLoading(true);
                setError('');
                try {
                    const response = await fetch(`https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/viewallimages?userName=${userName}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch thumbnails');
                    }
                    const data = await response.json();
                    const parsedBody = JSON.parse(data.body);
                    setThumbnails(parsedBody.thumbnails);
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



    if (!userName) return <p>Please log in to view images.</p>;
    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    console.log("thumbnails", thumbnails)

    const handleCopy = (index) => {
        setCopied(true);
        setCopiedIndex(index);
        setTimeout(() => {
            setCopied(false);
            setCopiedIndex(null);
        }, 2000); 
    };

    const handleViewImage = async (thumbnailUrl: string) => {
        console.log(thumbnailUrl)
        const cleanedUrl = thumbnailUrl.replace("_thumbnail", "").replace("goldfishthumbnails", "goldfishimages");
        const token = sessionStorage.getItem('idToken');
        console.log(cleanedUrl)
        console.log(token)
        try {
            const response = await fetch(cleanedUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}, Status Text: ${response.statusText}`);
                
            }
            const imageData = await response.json();
            console.log("Image Data:", imageData);
            // Handle image data as needed, e.g., displaying it in a modal or new page
        } catch (err) {
            console.error('Error fetching image:', err);
            // Handle error, e.g., show a notification to the user
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
                        <form onSubmit={() => {}} className="mb-3">
                            <div className="input-group mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search for images..."
                                    // value={searchQuery}
                                    // onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="btn btn-outline-secondary" type="submit">Search</button>
                            </div>
                        </form>
                    </div>
                    
                </section>

                <div className="album py-5 bg-light">
                    <div className="container">
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                            {Array.isArray(thumbnails) && thumbnails.map((url, index) => (
                                <div key={index} className="col">
                                    <div className="card shadow-sm">
                                        <img src={url} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
                                        <div className="card-body">
                                            <p className="card-text">Tags: { }</p>

                                                    
                                    
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group">
                                                <CopyToClipboard text={url} onCopy={() => handleCopy(index)}>
                                                    <button type="button" className="btn btn-secondary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clipboard" viewBox="0 0 16 16">
                                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                                    </svg>
                                                </button>
                                            </CopyToClipboard>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleViewImage(url)}>View</button>
                                                </div>
                                                
                                                {copied && copiedIndex === index && <span style={{ color: 'green' }}>Copied!</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewAllImagesPage;