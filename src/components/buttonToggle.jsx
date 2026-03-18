"use client";

import toggleTheme from "./toggleTheme";
import React, { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

const ButtonToggle = () => {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const saved = localStorage.getItem('theme');
        const current = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(current);
        document.documentElement.classList.toggle('dark', current === 'dark');
        if (!saved) localStorage.setItem('theme', current);
    }, []);

    return (
        <button
            id="toggle-theme"
            onClick={() => {
                const next = theme === "light" ? "dark" : "light";
                setTheme(next);
                toggleTheme();
            }}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
            }}
        >
            {theme === "light" ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>
    );
}

export default ButtonToggle;