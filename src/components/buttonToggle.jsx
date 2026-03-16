"use client";

import toggleTheme from "./toggleTheme";
import React, { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

const buttonToggle = () => {
    const [theme, setTheme] = useState("light");
    
    return (
        <button 
            id="toggle-theme" 
            onClick={() => {
                setTheme(theme === "light" ? "dark" : "light");
                toggleTheme();
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {theme === "light" ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>
    );
}

export default buttonToggle;