import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Game = () => {
    const [currentPassage, setCurrentPassage] = useState(null);
    const [inventory, setInventory] = useState(["omena", "porkkana"]); // Pelaajan inventaario
    const [messages, setMessages] = useState([]); // Pelaajan viestit
    const [horseData, setHorseData] = useState(null); // Näytettävät hevosen tiedot

    // Lataa ensimmäinen passage
    useEffect(() => {
        loadPassage("hallway");
    }, []);

    const loadPassage = async (path) => {
        try {
            const passage = await import(`../../public/data/stable/${path}.json`);
            setCurrentPassage(passage);
            setMessages([]); // Tyhjennä viestit
            setHorseData(null); // Tyhjennä hevosen tiedot, jos oli aiemmin ladattuna
        } catch (error) {
            console.error("Virhe ladattaessa tarinan osaa:", error);
        }
    };

    const loadHorseData = async (horseName) => {
        try {
            const horse = await import(`../../public/data/horses/${horseName}.json`);
            setHorseData(horse);   
        } catch (error) {
            console.error("Virhe ladattaessa hevosen tietoja:", error);
        }
    };

    const handleAction = (action) => {
        if (action.type === "read") {
            // Lue hevosen tiedot
            loadHorseData(action.horse);
        } else if (action.condition && !inventory.includes(action.condition)) {
            setMessages([`Tarvitset ${action.condition} suorittaaksesi tämän.`]);
        } else {
            if (action.type === "feed" || action.type === "collect") {
                setInventory((prev) =>
                    action.condition
                        ? prev.filter((item) => item !== action.condition)
                        : prev
                );
            }
            setMessages([action.result]);
        }
    };

    if (!currentPassage) {
        return <p>Ladataan tarinaa...</p>;
    }

    return (
        <div className="d-flex flex-column vh-100">
            {/* Yläpalkki - Inventaario */}
            <nav className="navbar navbar-dark bg-dark">
                <div className="container-fluid">
                    <span className="navbar-brand">Hevostallipeli</span>
                    <div>
                        <h5 className="text-white">Inventaario:</h5>
                        <ul className="list-inline text-white">
                            {inventory.length > 0
                                ? inventory.map((item, index) => (
                                      <li
                                          key={index}
                                          className="list-inline-item badge bg-secondary mx-1"
                                      >
                                          {item}
                                      </li>
                                  ))
                                : "Tyhjä"}
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Pääsisältö */}
            {/* Pääsisältö (kuva täyttää koko alueen) */}
            <main
                className="flex-grow-1 position-relative"
                style={{
                    backgroundImage: `url(/assets/images/${currentPassage.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <div
    className="speech-bubble"
    style={{
        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)", // Hieman tekstiin varjoa
    }}
>
    <h1>{currentPassage.name}</h1>
    <p>{currentPassage.text}</p>
</div>

                {/* Pelaajan viestit */}
                {messages.length > 0 && (
                    <div className="alert alert-success mt-3">
                        {messages.map((msg, index) => (
                            <p key={index}>{msg}</p>
                        ))}
                    </div>
                )}

                {/* Näytä hevosen tiedot */}
                {horseData && (
                    <div className="card mt-3">
                        <div className="card-header">{horseData.name}</div>
                        <div className="card-body">
                            <p>
                                <strong>Ikä:</strong> {horseData.age} vuotta
                            </p>
                            <p>
                                <strong>Rotu:</strong> {horseData.breed}
                            </p>
                            <p>{horseData.description}</p>
                            {horseData.image && (
                                <img
                                    src={`/assets/images/${horseData.image}`}
                                    alt={horseData.name}
                                    className="img-fluid rounded mt-3"
                                />
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Alapalkki - Navigointi ja interaktiot */}
            <nav className="navbar navbar-dark bg-dark fixed-bottom">
                <div className="container-fluid d-flex justify-content-center">
                    {/* Navigointilinkit */}
                    {currentPassage.links.map((link, index) => (
                        <button
                            key={index}
                            className="btn btn-primary mx-2 btn-secondary"
                            onClick={() => loadPassage(link.pid)}
                        >
                            {link.link}
                        </button>
                    ))}

                    {/* Toiminnot */}
                    {currentPassage.actions && (
                        <>
                            {currentPassage.actions.map((action, index) => (
                                <button
                                    key={index}
                                    className="btn btn-secondary mx-2"
                                    onClick={() => handleAction(action)}
                                >
                                    {action.text}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Game;
