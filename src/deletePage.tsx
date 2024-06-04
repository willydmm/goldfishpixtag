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
        if (inputValue === '') {
            alert('Please enter at least one image URL to delete.');
            return;
        }
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

    const handleCancel = () => {
        navigate('/');
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
                            <img src={url} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
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
