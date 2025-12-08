import { animate, useMotionValue, useTransform, motion, useInView } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Counter({ from, to, duration = 0.9 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10px" });
    const count = useMotionValue(from);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        if (isInView) {
            const controls = animate(count, to, { duration: duration, ease: "easeOut" });
            return controls.stop;
        }
    }, [count, to, duration, isInView]);

    return <motion.span ref={ref}>{rounded}</motion.span>;
}
