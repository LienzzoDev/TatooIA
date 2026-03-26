import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <div className="flex flex-col items-center px-4" key="overview">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-[family-name:var(--font-ornamental)] text-3xl tracking-wide text-foreground md:text-4xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Previsualiza tu Tatuaje
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 max-w-lg text-center text-muted-foreground/80 text-sm leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Sube una imagen del tatuaje que quieres y una foto de la parte del
        cuerpo donde te lo harías, o simplemente describe lo que quieres. La IA
        generará un preview realista para ti.
      </motion.div>
    </div>
  );
};
