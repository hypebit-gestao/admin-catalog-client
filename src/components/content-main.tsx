import React from "react";

interface ContentMainProps {
  children: React.ReactNode;
  title: string;
}

const ContentMain: React.FC<ContentMainProps> = ({ children, title }) => {
  return (
    <div className="bg-gray-primary h-full pt-32 pl-72 pr-20">
      <h1 className="text-[#2c6e49] font-bold text-3xl">{title}</h1>
      {children}
    </div>
  );
};

export default ContentMain;
