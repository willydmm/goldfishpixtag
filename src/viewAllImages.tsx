import { useEffect, useState } from 'react';

const ViewAllImagesPage = () => {
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


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
                    console.log("data", data);
                    const parsedBody = JSON.parse(data.body);
                    console.log("Parsed thumbnails:", parsedBody.thumbnails);
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

    return (
        <div>
            <header data-bs-theme="dark">
                <div className="navbar navbar-dark bg-dark shadow-sm">
                    <div className="container">
                        <a href="#" className="navbar-brand d-flex align-items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" aria-hidden="true" className="me-2" viewBox="0 0 24 24">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                            <strong>Album</strong>
                        </a>
                    </div>
                </div>
            </header>

            <main>
                <section className="py-5 text-center container">
                    <div className="row py-lg-5">
                        <div className="col-lg-6 col-md-8 mx-auto">
                            <h1 className="fw-light">Album example</h1>
                            <p className="lead text-muted">Something short and leading about the collection below—its contents, the creator, etc. Make it short and sweet, but not too short so folks don’t simply skip over it entirely.</p>
                        </div>
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
                                            <p className="card-text">This is a thumbnail image.</p>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group">
                                                    <button type="button" className="btn btn-sm btn-outline-secondary">View</button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary">Edit</button>
                                                </div>
                                                <small className="text-muted">9 mins</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="text-muted py-5">
                <div className="container">
                    <p className="float-end mb-1">
                        <a href="#">Back to top</a>
                    </p>
                    <p className="mb-1">Album example is © Bootstrap, but please download and customize it for yourself!</p>
                    <p className="mb-0">New to Bootstrap? <a href="/">Visit the homepage</a> or read our <a href="/docs/5.3/getting-started/introduction/">getting started guide</a>.</p>
                </div>
            </footer>
        </div>
    );
};

export default ViewAllImagesPage;