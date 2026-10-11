import { createContext, useState, useCallback } from 'react';
import * as aiApi from '../modules/ai/aiApi';

export const AIContext = createContext(null);

export function AIProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const fetchConversation = useCallback(async (projectId) => {
    setLoading(true);
    try {
      const res = await aiApi.getConversation(projectId);
      setMessages(res.data.messages);
    } catch (err) {
      // silent — an empty chat is a fine starting state
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (projectId, text) => {
    setSending(true);
    setError('');
    // Optimistic: show the user's own message immediately, before the round-trip
    setMessages((prev) => [...prev, { role: 'user', text, createdAt: new Date().toISOString() }]);
    try {
      const res = await aiApi.sendCommand(projectId, text);
      const replyText =
        res.data.result.type === 'text' ? res.data.result.message : res.data.result.output?.message || 'Done.';
      
      // Updated: Added sources mapping for citations
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'model', 
          text: replyText, 
          sources: res.data.result.sources || [], 
          createdAt: new Date().toISOString() 
        }
      ]);
      return res.data.result;
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'AI request failed');
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Sorry, something went wrong.', createdAt: new Date().toISOString() }
      ]);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  const clearChat = useCallback(async (projectId) => {
    await aiApi.clearConversation(projectId);
    setMessages([]);
  }, []);

  // Added addAssistantTurn function
  const addAssistantTurn = useCallback((userText, result) => {
    const replyText = result.type === 'text' ? result.message : result.output?.message || 'Done.';
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText, createdAt: new Date().toISOString() },
      { role: 'model', text: replyText, sources: result.sources || [], createdAt: new Date().toISOString() }
    ]);
  }, []);

  // Updated value object to expose addAssistantTurn
  const value = { 
    messages, 
    loading, 
    sending, 
    error, 
    fetchConversation, 
    sendMessage, 
    clearChat, 
    addAssistantTurn 
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}
