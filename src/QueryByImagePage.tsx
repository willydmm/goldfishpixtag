import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const handleUpload = async (event: React.FormEvent<HTMLFormElement>, callback: any) => {
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

            const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/query_by_image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Authorization': `Bearer ${idToken}`, // Add authorization token
                    
                },
                body: base64Content
            });
            const result = await response.json();
            console.log('Received response from API Gateway.', result);
            callback && callback(result)
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

const QueryByImagePage = () => {
    const navigate = useNavigate();
    const [imageFile, setImageFile] = useState(null);
    const [imageResults, setImageResults] = useState([]);
    const [copied, setCopied] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleImageChange = (event) => {
        setImageFile(event.target.files[0]);
    };

    // const handleSubmitImage = async (event) => {
    //     event.preventDefault();
    //     if (!imageFile) {
    //         alert('Please select an image to upload.');
    //         return;
    //     }

    //     const formData = new FormData();
    //     formData.append('image', imageFile);

    //     try {
    //         const response = await fetch('https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/query_by_image', {
    //             method: 'POST',
    //             body: formData,
    //         });

    //         if (!response.ok) throw new Error('Failed to fetch');

    //         const result = await response.json();
    //         setImageResults(result.images); // Assuming the API returns an array of image URLs
    //     } catch (error) {
    //         console.error('Error:', error);
    //         alert('Failed to upload image.');
    //     }
    // };

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
            const response = await fetch(`https://tw6nv3lpxl.execute-api.us-east-1.amazonaws.com/prod/presigned_url?url=${imageUrl}`, {
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
            <section className="py-5 px-5 text-center container">
                <div className="row py-lg-5">
                    <div className="col-lg-4 col-md-4 mx-auto">
                        <h2>Search for Similar Images</h2>
                    </div>
                    <div className='spacer'></div>
                    <form onSubmit={(e) => handleUpload(e, setImageResults)} className="mb-3 ml-5">
                        <div className="input-group mb-3">
                            <input type="file" accept="image/*" name="fileToUpload" id="fileToUpload"className="form-control" />
                            <button type="submit" className="btn btn-primary mt-2 mr-5">Upload</button>
                        </div>
                    </form>
                </div>
            </section>

            <div className="album py-3" style={{ marginBottom: '100px' }}>
                <h3>Matching Images</h3>
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 images">
                    {Array.isArray(imageResults) && imageResults.length > 0 ? (
                        imageResults.map((image, index) => (
                            <img src={image} width={400} key={index} />
                            // <div key={index} className="col image-card">
                            //     <div className="card shadow-sm">
                            //         <img src={image.presignedUrl} className="bd-placeholder-img card-img-top" alt={`Thumbnail ${index}`} style={{ objectFit: 'cover', height: '225px' }} />
                            //     </div>
                            //     <div className="card-body">
                            //         <p className="card-text">Tags: {image.tags.length > 0 ? image.tags.join(', ') : 'No tag identified'}</p>
                            //         <div className="d-flex justify-content-between align-items-center">
                            //             <div className="btn-group">
                            //                 <button type="button" className="btn btn-secondary" onClick={() => handleCopy(index)}>
                            //                     Copy URL
                            //                 </button>
                            //                 <button type="button" className="btn btn-secondary" onClick={() => handleViewImage(image.thumbnailUrl)}>
                            //                     View Image
                            //                 </button>
                            //             </div>
                            //             {copied && copiedIndex === index && <span style={{ color: 'green' }}>Copied!</span>}
                            //         </div>
                            //     </div>
                            // </div>
                        ))
                    ) : (
                        <p>No similar images found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueryByImagePage;
