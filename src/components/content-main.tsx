import React from "react";

interface ContentMainProps {
  children: React.ReactNode;
  title: string;
  centralized?: boolean;
}

const ContentMain: React.FC<ContentMainProps> = ({
  children,
  title,
  centralized,
}) => {
  return (
    <div className="bg-gray-primary w-full h-full pt-32 px-4 lg:px-32 ">
      <h1 className="text-[#2c6e49] font-bold text-3xl">{title}</h1>

      {children}
    </div>
  );
};

export default ContentMain;
