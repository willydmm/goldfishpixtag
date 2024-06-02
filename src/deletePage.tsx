import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DeletePage = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [thumbnailUrls, setThumbnailUrls] = useState([]);

    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleAddThumbnails = () => {
        const urls = inputValue.split('\n').map(url => url.trim()).filter(url => url);
        setThumbnailUrls(urls);
        setInputValue(''); // Clear input field after adding
    };

    const handleDeleteConfirmation = async () => {
        if (thumbnailUrls.length === 0) {
            alert('Please enter at least one image URL to delete.');
            return;
        }
        if (window.confirm('Are you sure you want to delete all the displayed images?')) {
            const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/delete', {
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

    return (
        <div className='topic'>
            <h3>Delete Images</h3>
            <textarea
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter image URLs separated by new lines"
                rows={5}
            />
            <div></div>
            <button onClick={handleAddThumbnails}>Load Thumbnails</button>
            <div className="image-gallery">
                {thumbnailUrls.map((url, index) => (
                    <div key={index} className="thumbnail">
                        <img src={url} alt={`Thumbnail ${index}`} style={{ width: 100, height: 100 }} />
                    </div>
                ))}
            </div>
            {thumbnailUrls.length > 0 && <button onClick={handleDeleteConfirmation}>Confirm Delete Images</button>}
        </div>
    );
};

export default DeletePage;
