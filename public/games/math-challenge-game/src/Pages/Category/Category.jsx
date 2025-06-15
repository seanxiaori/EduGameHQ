import CSS from "../Category/Category.css"
import Level from "../../Components/Level"
import { useAuth } from "../../Components/context"

function Category() {
    const levels = [
        {name: "addition", display: "2+2", color:"red"},
         {name: "subtraction", display: "4-1", color:"blue"},
          {name: "division", display: "10/5", color:"green"},
           {name: "multiplication", display: "2X2", color:"purple"}
        ]
    
    const levelCircles = levels.map((level)=>{
        return <Level 
        levelName={level.name} 
        levelDisplay={level.display}
        color={level.color}
        key={level.name}
        />
    })

    const {name, setNameFunction} = useAuth()


  return (
    <main className='categories-main'>
        <div className="top">
            <p>Hello {name} 👋<br />
             Please select a category you would like to play</p>
        </div>
        

        <div className="categories-body">
            <h1>Categories</h1>

        <div className="categories-container">
            {levelCircles}
            
            </div>
            
        </div>
    </main>
  )
}

export default Category