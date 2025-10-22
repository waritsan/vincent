'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean; // Add streaming indicator
}

interface ChatResponse {
  conversation_id: string;
  thread_id: string;
  message: string;
  response: string;
  timestamp: string;
  agent_id?: string;
  is_new_conversation?: boolean;
  error?: boolean;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId] = useState(`conv-${Date.now()}`);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        throw new Error('API URL not configured. Please set NEXT_PUBLIC_CHAT_API_URL or NEXT_PUBLIC_API_URL environment variable.');
      }
      
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_id: conversationId,
          thread_id: threadId,
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        // Create placeholder message for streaming
        const assistantMessageId = `msg-${Date.now()}-assistant`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        let accumulatedContent = '';
        let buffer = '';
        const chunkQueue: string[] = [];
        let isProcessing = false;

        // Function to process chunks with delay for smooth streaming effect
        const processChunkQueue = async () => {
          if (isProcessing) return;
          isProcessing = true;
          
          while (chunkQueue.length > 0) {
            const chunk = chunkQueue.shift();
            if (chunk) {
              accumulatedContent += chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent, isStreaming: true }
                    : msg
                )
              );
              // Small delay between chunks for smooth streaming effect
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }
          
          isProcessing = false;
        };

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              
              try {
                const data = JSON.parse(dataStr);
                
                if (data.type === 'metadata') {
                  // Store thread_id from metadata
                  if (data.thread_id) {
                    setThreadId(data.thread_id);
                  }
                } else if (data.type === 'chunk') {
                  // Add chunk to queue for smooth streaming
                  chunkQueue.push(data.content);
                  processChunkQueue();
                } else if (data.type === 'done') {
                  // Finalize message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: data.full_response, timestamp: data.timestamp, isStreaming: false }
                        : msg
                    )
                  );
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError, 'Line:', dataStr);
              }
            }
          }
        }
      } else {
        // Handle non-streaming JSON response (fallback)
        const data: ChatResponse = await response.json();

        // Store thread_id for future messages in this conversation
        if (data.thread_id) {
          setThreadId(data.thread_id);
        }

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setThreadId(null); // Reset thread to start new conversation
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#0066CC] hover:bg-[#0052A3] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-black text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-[#0066CC] rounded-full animate-pulse"></div>
          <div>
            <h3 className="font-semibold">Your Support Assistant</h3>
            <p className="text-xs opacity-90">
              {threadId ? `We&apos;re here to help` : 'Ask us anything, anytime'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="hover:bg-white/20 p-1 rounded transition-colors"
              aria-label="Clear chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#0066CC] rounded-full mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Hi there! I&apos;m here to help you understand your rights, explore benefits, and find the support you need.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0066CC] rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`${message.role === 'user' ? 'max-w-[80%]' : 'max-w-[85%]'} rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[#0066CC] text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  ) : (
                    <div className="text-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';
                            
                            if (language) {
                              return (
                                <div className="my-3 rounded-lg overflow-hidden">
                                  <div className="bg-gray-800 text-gray-200 px-3 py-1 text-xs font-mono flex items-center justify-between">
                                    <span>{language}</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(String(children))}
                                      className="hover:bg-gray-700 px-2 py-1 rounded text-xs transition-colors"
                                      title="Copy code"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={language}
                                    PreTag="div"
                                    className="!bg-gray-900 !m-0 text-xs"
                                    customStyle={{
                                      margin: 0,
                                      borderRadius: 0,
                                      background: '#1a1a1a'
                                    }}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                            
                            return (
                              <code
                                className="bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-xs font-mono border"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <div className="my-3">
                              {children}
                            </div>
                          ),
                          p: ({ children }) => (
                            <p className="mb-3 last:mb-0 leading-relaxed text-gray-800 dark:text-gray-200">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="mb-3 last:mb-0 pl-4 space-y-1 list-disc list-outside">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mb-3 last:mb-0 pl-4 space-y-1 list-decimal list-outside">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 pl-1">{children}</li>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-lg font-bold mb-3 mt-4 first:mt-0 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-bold mb-2 mt-4 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-gray-900 dark:text-gray-100">{children}</h3>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 my-3 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 rounded-lg border border-gray-200 dark:border-gray-600">
                              <table className="min-w-full border-collapse text-xs">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              {children}
                            </thead>
                          ),
                          th: ({ children }) => (
                            <th className="border-b border-gray-200 dark:border-gray-600 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border-b border-gray-200 dark:border-gray-600 px-3 py-2 text-gray-800 dark:text-gray-200">
                              {children}
                            </td>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.isStreaming && (
                        <span className="inline-block w-1.5 h-4 bg-[#0066CC] ml-0.5 animate-pulse"></span>
                      )}
                    </div>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user'
                        ? 'text-white/70'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start space-x-2 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-[#0066CC] rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#0066CC] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#0066CC] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#0066CC] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-[#0066CC] text-white rounded-lg hover:bg-[#0052A3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
