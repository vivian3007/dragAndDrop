import {useDroppable} from "@dnd-kit/core";
import DeleteIcon from '@mui/icons-material/Delete';
import {useEffect, useState} from "react";

export default function Trashcan({dragging} : {dragging: boolean}){
    const {setNodeRef, isOver} = useDroppable({
        id: 'trashcan',
    });

    const [overTrashcan, setOverTrashcan] = useState(false);

    const backgroundColor = isOver || (dragging && overTrashcan) ? '#F2F3AE' : null;

    return (
        <div style={{backgroundColor: backgroundColor, border: "3px solid black", borderRadius: "5%", width: "100%", display: "flex", justifyContent: "center", marginBottom: "20px"}}>
        <DeleteIcon style={{width: 200, height: 200}} ref={setNodeRef} onMouseEnter={() => {setOverTrashcan(true)}} onMouseUp={() => {setOverTrashcan(false)}}>TRASHCAN</DeleteIcon>
        </div>
    );
}