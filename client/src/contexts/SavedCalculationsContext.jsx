import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SavedCalculationsContext = createContext();

export const SavedCalculationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load from localStorage for non-authenticated users, API for authenticated
  const loadCalculations = useCallback(async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/calculations');
        setCalculations(data.data);
      } catch (err) {
        console.error('Failed to load calculations:', err);
      } finally {
        setLoading(false);
      }
    } else {
      const saved = localStorage.getItem('fincalc-calculations');
      setCalculations(saved ? JSON.parse(saved) : []);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCalculations();
  }, [loadCalculations]);

  const saveCalculation = async (calc) => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.post('/api/calculations', calc);
        setCalculations(prev => [data.data, ...prev]);
        return data.data;
      } catch (err) {
        throw err;
      }
    } else {
      const newCalc = {
        ...calc,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newCalc, ...calculations];
      setCalculations(updated);
      localStorage.setItem('fincalc-calculations', JSON.stringify(updated));
      return newCalc;
    }
  };

  const updateCalculation = async (id, updates) => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.put(`/api/calculations/${id}`, updates);
        setCalculations(prev => prev.map(c => c._id === id ? data.data : c));
        return data.data;
      } catch (err) {
        throw err;
      }
    } else {
      const updated = calculations.map(c => c._id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
      setCalculations(updated);
      localStorage.setItem('fincalc-calculations', JSON.stringify(updated));
    }
  };

  const deleteCalculation = async (id) => {
    if (isAuthenticated) {
      try {
        await axios.delete(`/api/calculations/${id}`);
        setCalculations(prev => prev.filter(c => c._id !== id));
      } catch (err) {
        throw err;
      }
    } else {
      const updated = calculations.filter(c => c._id !== id);
      setCalculations(updated);
      localStorage.setItem('fincalc-calculations', JSON.stringify(updated));
    }
  };

  const duplicateCalculation = async (id) => {
    if (isAuthenticated) {
      try {
        const { data } = await axios.post(`/api/calculations/${id}/duplicate`);
        setCalculations(prev => [data.data, ...prev]);
        return data.data;
      } catch (err) {
        throw err;
      }
    } else {
      const original = calculations.find(c => c._id === id);
      if (original) {
        const copy = {
          ...original,
          _id: Date.now().toString(),
          name: `${original.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updated = [copy, ...calculations];
        setCalculations(updated);
        localStorage.setItem('fincalc-calculations', JSON.stringify(updated));
        return copy;
      }
    }
  };

  return (
    <SavedCalculationsContext.Provider value={{
      calculations, loading, saveCalculation, updateCalculation,
      deleteCalculation, duplicateCalculation, loadCalculations,
    }}>
      {children}
    </SavedCalculationsContext.Provider>
  );
};

export const useSavedCalculations = () => {
  const context = useContext(SavedCalculationsContext);
  if (!context) throw new Error('useSavedCalculations must be used within SavedCalculationsProvider');
  return context;
};
