"use client";

import { useCallback, useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

interface ModalProps {
  isOpen?: boolean;
  header?: React.ReactElement;
  onClose: () => void;
  body?: React.ReactElement;
  footer?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  body,
  footer,
  header,
}) => {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        id="outside"
        onClickCapture={(e: any) => e.target.id === "outside" && handleClose()}
        className={`
justify-center
items-center
flex
overflow-x-hidden
overflow-y-auto
fixed
inset-0
z-[100]
outline-none
focus:outline-none
bg-neutral/70

  `}
      >
        <div
          className={`    relative
        w-[80%]
        md:w-4/6
        lg:w-3/6
        xl:w-[40%]
        3xl:w-[50%]
        my-6
        mx-auto
        lg:h-auto
        md:h-auto
        `}
        >
          {/* CONTENT */}
          <div
            className={`
      translate
      duration-300
      h-full
      ${showModal ? "translate-y-0" : "translate-y-full"}
      ${showModal ? "opacity-100" : "opacity-0"}
      `}
          >
            <div
              className={`overflow-auto
            scrollbar 
                scrollbar-none
            translate
            max-h-[70vh]
            md:max-h-[60vh]
            lg:h-auto
            md:h-auto
            border-0
            rounded-lg
            shadow-lg
            relative
            flex
            flex-col
            w-full
            bg-white
            outline-none
            focus:outline-none
          `}
            >
              <div
                onClick={() => handleClose()}
                className={`absolute top-2 left-6 cursor-pointer`}
              >
                <IoMdClose size={28} />
              </div>
              {/* HEADER */}
              <div className="mt-8 flex justify-center">{header}</div>
              {/* BODY */}
              <div
                className="
      mx-8 py-5  
          "
              >
                {body}
              </div>
              {/* FOOTER */}
              {footer}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
