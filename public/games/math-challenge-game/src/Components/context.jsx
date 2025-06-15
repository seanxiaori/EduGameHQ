import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";

export const ContextContainer = createContext()

const MyContextProvider = ({children}) => {
    const [name, setName] = useState(()=> localStorage.getItem("math-game-react"))
    const [globalScore, setGlobalScore] = useState(0)
    const [globalHighScore, setGlobalHighScore] = useState(0)
    const [completedLevelName, setCompletedLevelName] = useState("")

    function setNameFunction(playersName){
        setName(playersName)
    }

    return(
        <ContextContainer.Provider value={{name, setNameFunction, globalScore, setGlobalScore, globalHighScore, setGlobalHighScore, completedLevelName, setCompletedLevelName}}>
            {children}
        </ContextContainer.Provider>
    )
}

export function useAuth(){
    return useContext(ContextContainer)
}

export default MyContextProvider