import React from 'react';

export default function Header() {
    return (
        <header className="header">
            <nav className="navbar">
                <div className="logo">My App</div>
                <ul className="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About</a></li>
                    <li><a href="/contact">Contact</a></li>
                </ul>
            </nav>
        </header>
    );
}