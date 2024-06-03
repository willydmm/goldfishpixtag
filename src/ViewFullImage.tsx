import { useLocation, useNavigate } from 'react-router-dom';

const ViewFullImage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { imageUrl } = location.state;

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleSave = () => {
        window.open(imageUrl, '_blank');
    };

    return (
        <div className="image-viewer">
            <div className="buttons">
                <button onClick={handleSave} className="btn btn-primary">Save</button>
                <button onClick={handleGoBack} className="btn btn-secondary">Go Back</button>
                <div className='spacer'></div>
            </div>
            <img src={imageUrl} alt="Full Size" className="centered-image" />
        </div>
    );
};

export default ViewFullImage;
