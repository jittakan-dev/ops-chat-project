import React, { useRef } from "react";

function HorizontalScrollButtons({ children, scrollStep = 200 }) {
  const containerRef = useRef(null);

  const handleScroll = (scrollOffset) => {
    containerRef.current.scrollLeft += scrollOffset;
  };

  const handleLeftButtonClick = () => {
    handleScroll(-scrollStep);
  };

  const handleRightButtonClick = () => {
    handleScroll(scrollStep);
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <button onClick={handleLeftButtonClick}>{"<"}</button>
      <div
        ref={containerRef}
        style={{ overflowX: "auto", whiteSpace: "nowrap" }}
      >
        {children}
      </div>
      <button onClick={handleRightButtonClick}>{">"}</button>
    </div>
  );
}

export default HorizontalScrollButtons;
