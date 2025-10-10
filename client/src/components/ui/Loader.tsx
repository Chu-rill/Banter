import React from "react";

type LoaderProps = {
  size?: number; // default 80
  color?: string; // default #8d7958
};

export default function Loader({ size = 80, color = "#8d7958" }: LoaderProps) {
  return (
    <div
      className="loader"
      style={
        {
          width: `${size}px`,
          aspectRatio: "1",
          ["--c" as any]: `${color} 91%,#0000`,
        } as React.CSSProperties
      }
    />
  );
}

// Inline CSS for the loader animation
const style = document.createElement("style");
style.innerHTML = `
.loader {
  --c: #8d7958 91%,#0000;
  background:
    radial-gradient(30% 50% at -3px 55%, var(--c)) top right,
    radial-gradient(30% 50% at -3px 45%, var(--c)) bottom right,
    radial-gradient(30% 50% at calc(100% + 3px) 55%, var(--c)) top left,
    radial-gradient(30% 50% at calc(100% + 3px) 45%, var(--c)) bottom left,
    radial-gradient(50% 30% at 45% calc(100% + 3px), var(--c)) top right,
    radial-gradient(50% 30% at 45% -3px, var(--c)) bottom right,
    radial-gradient(50% 30% at 55% calc(100% + 3px), var(--c)) top left,
    radial-gradient(50% 30% at 55% -3px, var(--c)) bottom left;
  background-size: 50.1% 50.1%;
  background-repeat: no-repeat;
  -webkit-mask: radial-gradient(circle 5px, #0000 90%, #000);
  animation: l8 1.5s infinite linear;
}
@keyframes l8 {
  100% { transform: rotate(1turn); }
}`;
document.head.appendChild(style);
