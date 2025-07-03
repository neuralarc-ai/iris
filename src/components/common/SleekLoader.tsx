import React from 'react';

const SleekLoader = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="iris-spinner relative w-12 h-12 animate-iris-spin-3d">
        <div className="iris-spinner-face absolute inset-0 border-2 border-[#916D5B] bg-[#916D5B]/20" />
        <div className="iris-spinner-face absolute inset-0 border-2 border-[#916D5B] bg-[#916D5B]/20" />
        <div className="iris-spinner-face absolute inset-0 border-2 border-[#916D5B] bg-[#916D5B]/20" />
        <div className="iris-spinner-face absolute inset-0 border-2 border-[#916D5B] bg-[#916D5B]/20" />
        <div className="iris-spinner-face absolute inset-0 border-2 border-[#916D5B] bg-[#916D5B]/20" />
        <div className="iris-spinner-face absolute inset-0 border-2 border-[#916D5B] bg-[#916D5B]/20" />
      </div>
      <style jsx>{`
        .iris-spinner {
          transform-style: preserve-3d;
        }
        .iris-spinner-face:nth-of-type(1) {
          transform: translateZ(-24px) rotateY(180deg);
        }
        .iris-spinner-face:nth-of-type(2) {
          transform: rotateY(-270deg) translateX(50%);
          transform-origin: top right;
        }
        .iris-spinner-face:nth-of-type(3) {
          transform: rotateY(270deg) translateX(-50%);
          transform-origin: center left;
        }
        .iris-spinner-face:nth-of-type(4) {
          transform: rotateX(90deg) translateY(-50%);
          transform-origin: top center;
        }
        .iris-spinner-face:nth-of-type(5) {
          transform: rotateX(-90deg) translateY(50%);
          transform-origin: bottom center;
        }
        .iris-spinner-face:nth-of-type(6) {
          transform: translateZ(24px);
        }
        @keyframes iris-spin-3d {
          0% {
            transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
          }
          50% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(25deg);
          }
          100% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(385deg);
          }
        }
        .animate-iris-spin-3d {
          animation: iris-spin-3d 2s infinite cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default SleekLoader; 