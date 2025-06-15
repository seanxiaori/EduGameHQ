import x from "../../assets/x.svg"
import AnswerCircle from "../../Components/AnswerCircle"
import { useRef, useState } from "react"
import CSS from "../SingleLevel/SingleLevel.css"
import { useNavigate } from "react-router-dom"
import { useLayoutEffect } from "react"
import { useAuth } from "../../Components/context"
import ding from "../../assets/game ding.mp3"
import wrong from "../../assets/fail.mp3"

function Subtraction() {
  const [activeButton, setActiveButton] = useState()
  const [sign, setSign] = useState()
  const [randomNumber, setRandomNumber] = useState(()=> Math.ceil(Math.random() * 24))
  const [randomNumber2, setRandomNumber2] = useState(()=> Math.ceil(Math.random() * 10))
  const [randomIndex, setRandomIndex] = useState(()=> Math.floor(Math.random() * 4))
  const correctAnswer = randomNumber - randomNumber2
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [score, setScore] = useState(0)
  const answers = removeDuplicateNumbers([correctAnswer + 3, correctAnswer * 2 - correctAnswer + 1, correctAnswer + 5, correctAnswer - 1], 4)
  answers[randomIndex] = correctAnswer
  const {setGlobalScore, setCompletedLevelName, setGlobalHighScore} = useAuth()
  const floatingScoreRef = useRef()
  const audioCorrectRef = useRef()
  const audioWrongRef = useRef()
  const navigate = useNavigate()

  useLayoutEffect(()=>{
    document.body.classList = []
    document.body.classList.add("blue")
    setSign("-")
    setCompletedLevelName("subtraction")
  }, [])
  function removeDuplicateNumbers(array, arrayLength){
    console.log(array);
    let newArr = [...new Set(array)]
    if (arrayLength !== newArr.length) {
      newArr.push(65)
      }
          return newArr
  }
  function playSoundEffect(soundEffectRef){
    soundEffectRef.current.currentTime = 0

    if (soundEffectRef == audioWrongRef) {
      soundEffectRef.current.play()
        setTimeout(() => {
          soundEffectRef.current.pause()
        }, 2000)
    }else{
      soundEffectRef.current.play()
    }
    
  }
  function leaveGameConfirmation(){
      const leaveGame = confirm("Are you sure you want to leave the game?")
      leaveGame ? navigate ("/category") : ""
  }
  function highScoreSetter(currentScore, category){
      let prevHs = localStorage.getItem(`math-game-hs-${category}`)

      if (prevHs == null) {
        setGlobalHighScore(currentScore)
        localStorage.setItem(`math-game-hs-${category}`, currentScore)
      }else{
        if (currentScore >= prevHs) {
          localStorage.setItem(`math-game-hs-${category}`, currentScore)
          setGlobalHighScore(currentScore)

        }else{
          setGlobalHighScore(prevHs)
        }
      }
  }
  function nextGame(){
    if (currentQuestion == 5) {
      return navigate("/score")
    }
    setRandomNumber(Math.ceil(Math.random() * 24))
        setRandomNumber2( Math.ceil(Math.random() * 10))
        setActiveButton(null)
        setCurrentQuestion((prev)=> prev + 1)    
        setRandomIndex(Math.floor(Math.random() * 4)) 
  } 
  function handleButtonClick(){
    if (currentQuestion == 5) {
      if (activeButton == correctAnswer){
        playSoundEffect(audioCorrectRef)
        setGlobalScore(score + 20)
        highScoreSetter(score + 20, "subtraction")
        navigate("/score")
    }else{
      playSoundEffect(audioWrongRef)
        setGlobalScore(score)
        highScoreSetter(score, "subtraction")
        floatingScoreRef.current.classList.add("visible")
    }
    }else{
      if (activeButton == correctAnswer) {
        playSoundEffect(audioCorrectRef)   
        setScore((prev)=> prev + 20)
        nextGame()
     }
     else if (activeButton !== correctAnswer) {
      playSoundEffect(audioWrongRef)
        floatingScoreRef.current.classList.add("visible")
     }
    }  
  }

  const answerButtons = answers.map((answer, index)=>{
      return <AnswerCircle 
      answer={answer}
      key={index}
      index={index}
      activeButton={activeButton}
      setActiveButton={setActiveButton}
      />
  })

  return (
    <main className="gameplay-main">

      <audio 
      ref={audioCorrectRef}
      src={ding}>        
      </audio>

      <audio 
      ref={audioWrongRef}
      src={wrong}></audio>

      <div className="x-container">
        <img 
        src={x} 
        onClick={()=> leaveGameConfirmation()}
        alt="exit game" 
        className="cancel"/>
      </div>
        

        <p className="progress">
          Question {currentQuestion} of 5
        </p>

        <p className="question">
            {randomNumber + sign + randomNumber2}=?
        </p>

        <div className="answers">
            {answerButtons}
        </div>

        <button 
        onClick={()=>{handleButtonClick()}}
        className={activeButton != null | activeButton != undefined? "" : "disabled"}
        >Next Question</button>

      <div 
        ref={floatingScoreRef}        
        className="overlay">
          <div
        className="score-showcase">
          <p>Oops, that's not the right answer, {`${randomNumber} ${sign} ${randomNumber2}`} is actually<span> {correctAnswer}</span></p>

          <button
          onClick={()=>{
            floatingScoreRef.current.classList.remove("visible")
            nextGame()
          }}
          >Continue</button>
        </div>
          </div>
    </main>
  )
}

export default Subtraction