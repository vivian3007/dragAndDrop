import Draggable from "./Draggable";
import { v4 as uuidv4 } from "uuid";

export default function NavBar({ navBarRef }: { navBarRef: any }) {
    const shapes = [
        { type: "circle", label: "Circle" },
        { type: "square", label: "Square" },
        { type: "rectangle", label: "Rectangle" },
        { type: "oval", label: "Oval" },
    ];

    return (
        <nav className="Navbar" ref={navBarRef}>
            <h1>Vormen</h1>
            <div className={"draggables"}>
                {shapes.map((shape) => {
                    const uniqueId = `${shape.type}-${uuidv4()}`;
                    return (
                        <Draggable
                            key={uniqueId}
                            id={uniqueId}
                            data={{ type: shape.type, label: shape.label }}
                        >
                            {/* <div className="draggable-shape">{shape.label}</div> */}
                        </Draggable>
                    );
                })}
            </div>
        </nav>
    );
}

// return (
//   <nav className="Navbar" ref={navBarRef}>
//     <h1>Vormen</h1>
//     <div className={"draggables"}>
//       <Draggable id="circle">
//         <div className="draggable-shape">Circle</div>
//       </Draggable>
//       <Draggable id="square">
//         <div className="draggable-shape">Square</div>
//       </Draggable>
//       <Draggable id="rectangle">
//         <div className="draggable-shape">Rectangle</div>
//       </Draggable>
//       <Draggable id="oval">
//         <div className="draggable-shape">Oval</div>
//       </Draggable>
//     </div>
//   </nav>
// );
// }
