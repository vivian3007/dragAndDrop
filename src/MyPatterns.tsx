import { Card, Typography } from "@mui/material";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config.js";
import { useCallback } from "react";

interface Amigurumi {
    id: string;
    name: string;
    height: number;
    tags: string[];
    favorite: boolean;
    yarn_id: string;
}

const MyPatterns = ({ amigurumis, setAmigurumis }: { amigurumis: Amigurumi[], setAmigurumis: any }) => {
    const handleFavoriteChange = useCallback(
        (amigurumi: Amigurumi) => async () => {
            try {
                console.log(`Updating favorite for ${amigurumi.id}: ${!amigurumi.favorite}`);
                const newFavoriteStatus = !amigurumi.favorite;
                await updateDoc(doc(db, "amigurumi", amigurumi.id), {
                    favorite: newFavoriteStatus,
                });
                setAmigurumis((prev: Amigurumi[]) =>
                    prev.map((a) =>
                        a.id === amigurumi.id ? { ...a, favorite: newFavoriteStatus } : a
                    )
                );
                console.log(`Updated favorite for ${amigurumi.id} successfully`);
            } catch (error) {
                console.error("Error updating favorite:", error);
            }
        },
        [setAmigurumis]
    );

    return (
        <div className="pattern">
            <div className="pattern-container">
                {amigurumis.map((amigurumi) => (
                    <Card key={amigurumi.id} className="pattern-text-container">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h1 style={{ marginTop: 0, marginBottom: 0 }}>{amigurumi.name}</h1>
                            {amigurumi.favorite ? (
                                <Favorite
                                    sx={{ color: "red", fontSize: "1.5rem", cursor: "pointer" }}
                                    onClick={handleFavoriteChange(amigurumi)}
                                />
                            ) : (
                                <FavoriteBorder
                                    sx={{ color: "grey", fontSize: "1.5rem", cursor: "pointer" }}
                                    onClick={handleFavoriteChange(amigurumi)}
                                />
                            )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <h3>Tags</h3>
                            <ul>
                                {amigurumi.tags.map((tag, index) => (
                                    <li key={index}>{tag}</li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default MyPatterns;