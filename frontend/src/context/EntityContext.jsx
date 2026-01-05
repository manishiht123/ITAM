import { createContext, useContext, useState } from "react";

const EntityContext = createContext(null);

export const EntityProvider = ({ children }) => {
  const [entity, setEntity] = useState("OFB");

  return (
    <EntityContext.Provider value={{ entity, setEntity }}>
      {children}
    </EntityContext.Provider>
  );
};

export const useEntity = () => {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error("useEntity must be used within EntityProvider");
  }
  return context;
};

