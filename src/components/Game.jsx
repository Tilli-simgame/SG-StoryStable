import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Game = () => {
    const [currentPassage, setCurrentPassage] = useState(null);
    const [inventory, setInventory] = useState({}); // Esineet ja niiden määrät
    const [messages, setMessages] = useState([]); // Pelaajan viestit
    const [horseData, setHorseData] = useState(null); // Näytettävät hevosen tiedot
    const [activeAction, setActiveAction] = useState(null); // Tila aktiiviselle napille
    const [followUpAction, setFollowUpAction] = useState(null); // Yksittäinen jatkotoiminto
    const [followUpOptions, setFollowUpOptions] = useState(null); // Lista vaihtoehdoista
    const [modalData, setModalData] = useState(null); // Modalissa näytettävät tiedot
    const [notifications, setNotifications] = useState([]); // Lista notifikaatioista


    // Lataa ensimmäinen passage
    useEffect(() => {
        loadPassage("hallway");
    }, []);


    useEffect(() => {
        if (notifications.length > 0) {
            const timer = setTimeout(() => {
                setNotifications((prev) => prev.slice(1));
            }, 3000);
    
            return () => clearTimeout(timer); // Puhdistus
        }
    }, [notifications]);
    

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
            if (activeAction && activeAction.text === action.text) {
                setActiveAction(null);
                setModalData(null);
            } else {
                setActiveAction(action);
                setModalData({
                    title: action.text,
                    content: action.result,
                    options: action.options || [],
                });
            }
        } else if (action.type === "read") {
            // Lataa hevosen tiedot
            loadHorseData(action.horse);
        } else if (action.type === "feed") {
            // Tarkista, onko tarvittava tavara inventaariossa
            const item = action.condition; // Esine, jota tarvitaan ruokintaan
            if (inventory[item] && inventory[item] > 0) {
                // Vähennä esineen määrää inventaariosta
                setInventory((prev) => ({
                    ...prev,
                    [item]: prev[item] - 1,
                }));
    
                // Näytä ruokinnan tulos
                setMessages([action.result]);
    
                // Notifikaatio onnistuneesta ruokinnasta
                setNotifications((prev) => [
                    ...prev,
                    { message: `Ruokit hevosen: ${item}.`, id: Date.now() },
                ]);
            } else {
                // Näytä viesti, jos tavaraa ei ole tarpeeksi
                setMessages([`Sinulla ei ole ${item}.`]);
                setNotifications((prev) => [
                    ...prev,
                    { message: `Sinulla ei ole ${item}.`, id: Date.now() },
                ]);
            }
        } else if (action.type === "pet") {
            // Näytä silittämisen tulos
            setMessages([action.result]);
    
            // Notifikaatio silittämisestä
            setNotifications((prev) => [
                ...prev,
                { message: "Rapsutit hevosta. Se näyttää tyytyväiseltä!", id: Date.now() },
            ]);
        } else if (action.type === "collect") {
            setInventory((prev) => {
                const currentCount = prev[action.item] || 0;
                if (action.stackable) {
                    return {
                        ...prev,
                        [action.item]: currentCount + 1,
                    };
                }
                if (currentCount === 0) {
                    return {
                        ...prev,
                        [action.item]: 1,
                    };
                }
                setNotifications((prev) => [
                    ...prev,
                    { message: `Sinulla on jo ${action.item}.`, id: Date.now() },
                ]);
                return prev;
            });
            setNotifications((prev) => [
                ...prev,
                { message: `Lisätty tavara: ${action.item}`, id: Date.now() },
            ]);
        } else {
            setMessages([action.result]);
        }
    };
    

    const closeModal = () => {
        setModalData(null); // Sulje modal
        setActiveAction(null); // Nollaa aktiivinen painike
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
        {Object.keys(inventory).length > 0
            ? Object.entries(inventory).map(([item, count], index) => (
                  <li
                      key={index}
                      className="list-inline-item badge bg-secondary mx-1"
                  >
                      {item} x{count}
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
                {/* Notifikaatiot */}
<div className="notifications" style={{ position: "fixed", top: 100, right: 10, zIndex: 1050 }}>
    {notifications.map((notification) => (
        <div
            key={notification.id}
            className="alert alert-info alert-dismissible fade show"
            role="alert"
        >
            {notification.message}
            <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() =>
                    setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
                }
            ></button>
        </div>
    ))}
</div>

{/* Modal Bootstrapilla */}
{modalData && (
    <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="modal-title"
        aria-hidden="true"
    >
        <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title" id="modal-title">
                        {modalData.title}
                    </h5>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={closeModal} // Käytä päivitettyä sulkemislogiikkaa
                    ></button>
                </div>
                <div className="modal-body">
                    <p>{modalData.content}</p>
                    {modalData.options.length > 0 &&
                        modalData.options.map((option, index) => (
                            <button
                                key={index}
                                className="btn btn-primary mt-2"
                                onClick={() => handleAction(option)}
                            >
                                {option.text}
                            </button>
                        ))}
                </div>
            </div>
        </div>
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
