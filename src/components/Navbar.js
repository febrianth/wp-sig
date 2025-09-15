import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    // Di masa depan, kita akan membuat styling navbar ini lebih bagus dengan Bootstrap
    return (
        <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
            <Link to="/" style={{ marginRight: '15px' }}>Dashboard</Link>
            <Link to="/members">Daftar Member</Link>
        </nav>
    );
}

export default Navbar;