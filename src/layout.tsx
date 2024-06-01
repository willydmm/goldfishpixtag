import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
    children: ReactNode;
}
    

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/login');
    };

    return (
        <div>
            <header data-bs-theme="dark">
                <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
                    <Link to="/" className="d-flex align-items-center mb-2 mb-lg-0 text-white text-decoration-none">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/1717/1717945.png" 
                            alt="GoldFishPixTag" 
                            height="60"
                            className="bi me-2"
                            style={{ paddingLeft: '20px' , paddingRight: '5px'}}
                        />
                    </Link>

                    <p style={{ fontSize: '20px', color: 'white', fontWeight: 'bold'}}>GoldfishPixTag</p>

                    <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0" style={{marginLeft: 20}}>
                        <li><Link to="/" className="nav-link px-2 text-secondary">Home</Link></li>
                        <li><Link to="/viewallimages" className="nav-link px-2 text-white">MyGallery</Link></li>
                        <li><Link to="/delete" className="nav-link px-2 text-white">DeleteImages</Link></li>
                        <li><Link to="/faqs" className="nav-link px-2 text-white">FAQs</Link></li>
                        <li><Link to="/about" className="nav-link px-2 text-white">About</Link></li>
                    </ul>


                    <div className="text-end">
                        <button type="button" className="btn btn-outline-light me-2">Me</button>
                        <button onClick={handleLogout} type="button" className="btn btn-warning">LogOut</button>
                    </div>
                </div>
            </header>
            <main>{children}</main>
            <footer className="text-muted py-5">
                <div className="container">
                    <p className="float-end mb-1">
                        <Link to="#">Back to top</Link>
                    </p>
                    <p className="mb-1">@2024 GoldFishes</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
