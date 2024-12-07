import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Game = () => {
    const [currentPassage, setCurrentPassage] = useState(null);
    const [inventory, setInventory] = useState({}); // Esineet ja niiden määrät
    //const [messages, setMessages] = useState([]); // Pelaajan viestit
    const [horseData, setHorseData] = useState(null); // Näytettävät hevosen tiedot
    const [activeAction, setActiveAction] = useState(null); // Tila aktiiviselle napille
    //const [followUpAction, setFollowUpAction] = useState(null); // Yksittäinen jatkotoiminto
    //const [followUpOptions, setFollowUpOptions] = useState(null); // Lista vaihtoehdoista
    const [modalData, setModalData] = useState(null); // Modalissa näytettävät tiedot
    const [uiMessages, setUiMessages] = useState([]); // Yhdistetty tila reaktioille ja notifikaatioille




    // Lataa ensimmäinen passage
    useEffect(() => {
        loadPassage("hallway");
    }, []);

    useEffect(() => {
      if (uiMessages.length > 0) {
          const timer = setTimeout(() => {
              setUiMessages((prev) => prev.slice(1)); // Poista ensimmäinen viesti
          }, 3000);
  
          return () => clearTimeout(timer);
      }
  }, [uiMessages]);
  
    

    const loadPassage = async (path) => {
        try {
            const passage = await import(`../../public/data/stable/${path}.json`);
            setCurrentPassage(passage);
            //setMessages([]); // Tyhjennä viestit
            setHorseData(null); // Tyhjennä hevosen tiedot, jos oli aiemmin ladattuna
            //setFollowUpAction(null); // Nollaa yksittäinen jatkotoiminto
            //setFollowUpOptions(null); // Nollaa jatkotoimintojen lista
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
      switch (action.type) {
          case "inspect":
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
              break;
  
          case "feed":
              const item = action.condition; // Esine, jota tarvitaan ruokintaan
              if (inventory[item] && inventory[item] > 0) {
                  setInventory((prev) => ({
                      ...prev,
                      [item]: prev[item] - 1,
                  }));
                  //setMessages([action.result]);
  
                  // Lisää hevosen reaktio viestilistaukseen
                  setUiMessages((prev) => [
                      ...prev,
                      { type: "reaction", content: action.result, id: Date.now() },
                  ]);
              } else {
                  //setMessages([`Sinulla ei ole ${item}.`]);
  
                  // Lisää notifikaatio viestilistaukseen
                  setUiMessages((prev) => [
                      ...prev,
                      { type: "notification", content: `Sinulla ei ole ${item}.`, id: Date.now() },
                  ]);
              }
              break;
  
          case "pet":
              //setMessages([action.result]);
  
              // Lisää hevosen reaktio viestilistaukseen
              setUiMessages((prev) => [
                  ...prev,
                  { type: "reaction", content: "Rapsutit hevosta. Se näyttää tyytyväiseltä!", id: Date.now() },
              ]);
              break;
  
          case "read":
              loadHorseData(action.horse);
              break;
  
          case "collect":
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
                  setUiMessages((prev) => [
                      ...prev,
                      { type: "notification", content: `Sinulla on jo ${action.item}.`, id: Date.now() },
                  ]);
                  return prev;
              });
              setUiMessages((prev) => [
                  ...prev,
                  { type: "notification", content: `Lisätty tavara: ${action.item}`, id: Date.now() },
              ]);
              break;
  
          default:
              //setMessages([action.result]);
              break;
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
{/* Viestit ja reaktiot */} 
<div className="ui-messages" style={{ position: "fixed", top: 10, right: 10, zIndex: 1050 }}>
    {uiMessages.map((message) => (
        <div
            key={message.id}
            className={`alert ${
                message.type === "notification" ? "alert-info" : "horse-reaction-bubble"
            } alert-dismissible fade show`}
            role="alert"
        >
            <p>{message.content}</p>
            <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setUiMessages((prev) => prev.filter((msg) => msg.id !== message.id))}
            ></button>
        </div>
    ))}
</div>


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
