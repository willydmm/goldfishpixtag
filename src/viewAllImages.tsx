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
            <main>
                <section className="py-5 text-center container">
                    <div className="row py-lg-5">
                        <div className="col-lg-4 col-md-4 mx-auto">
                            <h1 className="fw-light">Photo Gallery</h1>
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
                                            <p className="card-text">Tags: {}</p>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="btn-group">
                                                    <button type="button" className="btn btn-sm btn-outline-secondary">View</button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary">Add Tag</button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary">Delete Tag</button>
                                                </div>
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