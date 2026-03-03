import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const ScrollAnimation = ({ 
  children, 
  variants = {},
  initial = "hidden",
  animate = "visible",
  transition = { duration: 0.6, ease: "easeOut" },
  className = "",
  delay = 0,
  as = "div"
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    amount: 0.3, // Se activa cuando 30% del elemento es visible
    margin: "0px 0px -100px 0px" // Margen negativo para activar antes
  });

  const defaultVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  const animationVariants = { ...defaultVariants, ...variants };
  const MotionComponent = motion[as];

  return (
    <MotionComponent
      ref={ref}
      initial={initial}
      animate={isInView ? animate : initial}
      variants={animationVariants}
      transition={{ ...transition, delay }}
      className={className}
      style={{ 
        display: 'inherit',
        flexDirection: 'inherit',
        alignItems: 'inherit',
        justifyContent: 'inherit',
        gap: 'inherit',
        flex: 'inherit',
        width: 'inherit',
        height: 'inherit'
      }}
    >
      {children}
    </MotionComponent>
  );
};

export default ScrollAnimation;
