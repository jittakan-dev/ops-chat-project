import { useState } from "react";

function DragItem({ children }) {
  const [isDragging, setIsDragging] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [elementPosition, setElementPosition] = useState({ x: 0, y: 0 });

  function handleMouseDown(event) {
    setIsDragging(true);
    setMouseOffset({
      x: event.clientX - elementPosition.x,
      y: event.clientY - elementPosition.y,
    });
  }

  function handleMouseMove(event) {
    if (isDragging) {
      setElementPosition({
        x: event.clientX - mouseOffset.x,
        y: event.clientY - mouseOffset.y,
      });
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  return (
    <div
      className="cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        transform: `translate(${elementPosition.x}px, ${elementPosition.y}px)`,
      }}
    >
      {children}
    </div>
  );
}

export default DragItem;
