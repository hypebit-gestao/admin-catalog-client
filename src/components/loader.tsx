"use client";

import React from "react";

interface LoaderProps {
  size?: number;
  color?: string;
}

const Loader = ({ size, color = "text-white" }: LoaderProps) => {
  return (
    <>
      <div className="flex justify-center items-center w-full h-full">
        <div
          className={`inline-block ${color} h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    </>
  );
};

export default Loader;
