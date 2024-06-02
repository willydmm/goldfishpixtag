import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams();
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchImages = async () => {
        setIsLoading(true);
        setError('');
        const tags = searchParams.get('tags');
        if (!tags) {
            setError('No search tags provided.');
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/query_by_tags?query=${tags}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
            }
            });
            if (!response.ok) {
            throw new Error('Failed to fetch results');
            }
            const data = await response.blob();
            console.log(data);
        } catch (error) {
            console.error('Failed to fetch images:', error);
            setError('Failed to fetch search results.');
        }
        setIsLoading(false);
        };

        fetchImages();
    }, [searchParams]);

    return (
        <div>
        <h1>Search Results</h1>
        {isLoading ? (
            <p>Loading...</p>
        ) : error ? (
            <p>{error}</p>
        ) : (
            <div className="results-grid">
            {images.length > 0 ? (
                images.map((img, index) => (
                <img key={index} src={img.thumbnailUrl} alt="Search result" />
                ))
            ) : (
                <p>No results found.</p>
            )}
            </div>
        )}
        </div>
    );
    };

    export default SearchResultsPage;
