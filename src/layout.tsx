import React, { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [tags, setTags] = useState('');

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
    const userId = getUsernameFromToken();

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    const handleAddTags = async () => {
        const response = await fetch('https://n77av6hvj3.execute-api.ap-southeast-2.amazonaws.com/prod/add_tag_preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
            },
            body: JSON.stringify({ user_id: userId, tags: tags })
        });
        
        if (response.ok) {
            alert('Tags added successfully! Email will be sent when a new image is uploaded');
        } else {
            alert('Failed to update tags');
        }

        setShowModal(false);
    };


    return (
        <div className="d-flex flex-column min-vh-100">
            <header data-bs-theme="dark">
                <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
                    <Link to="/" className="d-flex align-items-center mb-2 mb-lg-0 text-white text-decoration-none">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/1717/1717945.png"
                            alt="GoldFishPixTag"
                            height="60"
                            className="bi me-2"
                            style={{ paddingLeft: '20px', paddingRight: '5px' }}
                        />
                    </Link>

                    <p style={{ fontSize: '20px', color: 'white', fontWeight: 'bold' }}>GoldfishPixTag</p>

                    <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0" style={{ marginLeft: 20 }}>
                        <li><Link to="/" className="nav-link px-2 text-white">Home</Link></li>
                        <li><Link to="/querybyimage" className="nav-link px-2 text-white">Find Similar Images</Link></li>
                        <li><Link to="/delete" className="nav-link px-2 text-white">Batch Delete with Urls</Link></li>
                    </ul>

                    <div className="text-end">
                        <button type="button" className="btn btn-outline-light me-4" onClick={() => setShowModal(true)}>Notification</button>
                        <button onClick={handleLogout} type="button" className="btn btn-warning me-3">LogOut</button>
                    </div>
                </div>
            </header>
            <main className="flex-grow-1">{children}</main>
            {/* Modal for Tag Preferences */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                        <h4>Add Tags to Receive Notification</h4>
                        <input
                            className='taginput'
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Enter tags, separated by commas"
                        />
                        <button className='btn btn-primary' onClick={handleAddTags}>Save</button>
                    </div>
                </div>
            )}
            <footer className="text-muted py-4" data-bs-theme="dark">
                <div className="container d-flex justify-content-between align-items-center">
                    <div className="d-inline-flex align-items-center">
                        <p className="mb-0">@2024 FIT5225 GoldFishes</p>
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/1717/1717945.png"
                            alt="GoldFishPixTag"
                            height="20"
                            className="mb-0"
                            style={{ paddingLeft: '10px'}}
                        />
                    </div>
                    <p className="mb-0 me-3">
                        <Link to="#">Back to top</Link>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
