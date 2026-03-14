import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const ScrollAnimation = ({
  children,
  variants = {},
  initial = "hidden",
  animate = "visible",
  transition = { duration: 0.6, ease: "easeOut" },
  className = "",
  delay = 0,
  as = "div",
  style = {}
}) => {
  const ref = useRef(null);
  const [initiallyVisible, setInitiallyVisible] = useState(false);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.1,
    margin: "0px 0px -50px 0px"
  });

  // Al montar, verificar si el elemento ya está en el viewport
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      if (inViewport) {
        setInitiallyVisible(true);
      }
    }
  }, []);

  const defaultVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  const animationVariants = { ...defaultVariants, ...variants };
  const MotionComponent = motion[as];

  return (
    <MotionComponent
      ref={ref}
      initial={initiallyVisible ? "visible" : initial}
      animate={isInView || initiallyVisible ? animate : initial}
      variants={animationVariants}
      transition={initiallyVisible ? { duration: 0 } : { ...transition, delay }}
      className={className}
      style={style}
    >
      {children}
    </MotionComponent>
  );
};

export default ScrollAnimation;
