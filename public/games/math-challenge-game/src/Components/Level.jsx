import React from 'react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Level({levelName, levelDisplay}) {
    const navigate = useNavigate()
    const btnRef = useRef()


    function handleClick(name){
        btnRef.current.classList.add(`active-${name}`)
        setTimeout(() => {
             navigate(`/category/${levelName}`)
        }, 500);
       
    }


  return (
    <div 
    onClick={()=>handleClick(levelName)}
    className={`${levelName}`}>

        <div
        ref={btnRef}
        className={`${levelName}-circle`}>
            <p>{levelDisplay}</p>
            </div>
                <p>{levelName}</p>
            </div>
  )
}

export default Level