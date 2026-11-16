import { cloneElement, useEffect, useRef, useState } from "react";

export default function Reveal({ children }) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  return cloneElement(children, {
    ref: elementRef,
    className: `${children.props.className || ""} transition-[opacity_0.7s_cubic-bezier(0.16,1,0.3,1),transform_0.7s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-[18px] opacity-0"}`, 
  });
}
