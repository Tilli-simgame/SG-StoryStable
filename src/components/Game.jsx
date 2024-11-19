import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Game = () => {
    const [currentPassage, setCurrentPassage] = useState(null);
    const [inventory, setInventory] = useState(["omena", "porkkana"]); // Pelaajan inventaario
    const [messages, setMessages] = useState([]); // Pelaajan viestit
    const [horseData, setHorseData] = useState(null); // Näytettävät hevosen tiedot
    const [activeAction, setActiveAction] = useState(null); // Tila aktiiviselle napille
    const [followUpAction, setFollowUpAction] = useState(null); // Yksittäinen jatkotoiminto
    const [followUpOptions, setFollowUpOptions] = useState(null); // Lista vaihtoehdoista

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
            setFollowUpAction(null); // Nollaa yksittäinen jatkotoiminto
            setFollowUpOptions(null); // Nollaa jatkotoimintojen lista
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
        if (action.type === "inspect") {
            // Jos painike on jo aktiivinen, nollaa tila (sulje tarkastelu)
            if (activeAction && activeAction.text === action.text) {
                setMessages([]);
                setFollowUpAction(null);
                setFollowUpOptions(null);
                setActiveAction(null); // Nollaa aktiivinen painike
            } else {
                // Aseta uusi aktiivinen painike ja näytä tulokset
                setMessages([action.result]);
                setActiveAction(action);

                if (action.options) {
                    setFollowUpOptions(action.options);
                } else if (action.followUp) {
                    setFollowUpAction(action.followUp);
                }
            }
        } else if (action.type === "read") {
            // Lue hevosen tiedot
            loadHorseData(action.horse);
        } else if (action.type === "collect") {
            // Lisää esine inventaarioon, jos sitä ei jo ole
            if (!inventory.includes(action.item)) {
                setInventory((prev) => [...prev, action.item]);
                setMessages([action.result]);
            } else {
                setMessages([`Sinulla on jo ${action.item}.`]);
            }
            setFollowUpAction(null);
            setFollowUpOptions(null);
            setActiveAction(null); // Nollaa aktiivinen painike keräystoiminnon jälkeen
        } else {
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
                {/* Puhekupla sisältää otsikon ja tekstin */}
                <div
                    className="speech-bubble"
                    style={{
                        textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)", // Hieman tekstiin varjoa
                    }}
                >
                    <h1>{currentPassage.name}</h1>
                    <p>{currentPassage.text}</p>
                </div>

                {/* Näytä viestit ja jatkotoiminnot */}
                {messages.length > 0 && (
                    <div className="alert alert-success mt-3">
                        {messages.map((msg, index) => (
                            <p key={index}>{msg}</p>
                        ))}

                        {followUpAction && (
                            <button
                                className="btn btn-primary mt-2"
                                onClick={() => handleAction(followUpAction)}
                            >
                                {followUpAction.text}
                            </button>
                        )}

                        {followUpOptions &&
                            followUpOptions.map((option, index) => (
                                <button
                                    key={index}
                                    className="btn btn-primary mt-2 mx-2"
                                    onClick={() => handleAction(option)}
                                >
                                    {option.text}
                                </button>
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
                            className="btn btn-secondary mx-2"
                            onClick={() => loadPassage(link.pid)}
                        >
                            {link.link}
                        </button>
                    ))}

                    {/* Toiminnot */}
                    {currentPassage.actions &&
                        currentPassage.actions.map((action, index) => (
                            <button
                                key={index}
                                className={`btn mx-2 ${
                                    activeAction && activeAction.text === action.text
                                        ? "btn-primary active-button"
                                        : "btn-secondary"
                                }`}
                                onClick={() => handleAction(action)}
                            >
                                {action.text}
                            </button>
                        ))}
                </div>
            </nav>
        </div>
    );
};

export default Game;
