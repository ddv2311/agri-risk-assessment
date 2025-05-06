import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Define the context type
type ScenarioContextType = {
  scenario: string;
  setScenario: (scenario: string) => void;
};

// Create the context with default values
const ScenarioContext = createContext<ScenarioContextType>({
  scenario: 'normal',
  setScenario: () => {},
});

// Create a provider component
export const ScenarioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scenario, setScenario] = useState('normal');

  return (
    <ScenarioContext.Provider value={{ scenario, setScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
};

// Create a custom hook to use the context
export const useScenario = () => useContext(ScenarioContext);
