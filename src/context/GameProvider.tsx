import { createContext } from "react";

interface GameContext {
  isStated?: boolean;
}

const context = createContext<GameContext>({});

export const GameProvider = () => {
  // const isStated = useMemo(() => )
};
