import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const PhoneError = () => {
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth <= 1050);
        };

        handleResize(); // Check on initial render
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    if (!isSmallScreen) {
        return null; // Don't render anything if the screen is larger than 1050px
    }

    return (
        <Box
            className="flex items-center justify-center h-screen bg-red-100"
            sx={{ textAlign: "center" }}
        >
            <Typography
                variant="h6"
                className="text-red-600 font-bold p-4 rounded-lg bg-white shadow-lg"
            >
                Uzur, hozircha saytni Telefon varianti YO'Q. Iltimos, Kompyuter yoki
                Planshettan oching.
            </Typography>
        </Box>
    );
};

export default PhoneError;