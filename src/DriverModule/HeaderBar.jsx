import React from "react";

const HeaderBar = () => {
  return (
    <header
      className="fixed top-0 left-[250px] right-0 h-[70px] bg-[#222] flex items-center justify-end pr-8 z-[100] transition-all duration-200 ease-in-out
                 max-[900px]:left-0 max-[900px]:right-0 max-[900px]:w-full"
    >
      <div
        className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-600 cursor-pointer"
      >
        <span role="img" aria-label="avatar">
          👤
        </span>
      </div>
    </header>
  );
};

export default HeaderBar;
