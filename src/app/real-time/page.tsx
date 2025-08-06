'use client'

import { useState, useRef, useEffect } from 'react'

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'error' | 'debug'
  message: string
  data?: any
}

export default function RealTimeTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    }
    setLogs(prev => [...prev, entry])
  }

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const startRealTimeTest = () => {
    if (isRunning) return

    setIsRunning(true)
    setLogs([])
    setResults(null)
    setConnectionStatus('connecting')

    addLog('info', '🔌 Connecting to real-time test stream...')

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Create new EventSource connection
    const eventSource = new EventSource('/api/live-test')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnectionStatus('connected')
      addLog('success', '✅ Connected to live stream')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'log') {
          addLog(data.level, data.message, data.data)
        } else if (data.type === 'result') {
          if (data.success) {
            addLog('success', '🎉 Test completed successfully!')
            setResults(data.data)
          } else {
            addLog('error', `❌ Test failed: ${data.error}`)
            if (data.stack) {
              addLog('debug', `Stack: ${data.stack}`)
            }
          }
        } else if (data.type === 'complete') {
          addLog('info', '🏁 Stream completed')
          eventSource.close()
          setIsRunning(false)
          setConnectionStatus('disconnected')
        }
      } catch (error) {
        addLog('error', `Failed to parse stream data: ${error}`)
      }
    }

    eventSource.onerror = (error) => {
      addLog('error', '💥 Stream connection error')
      console.error('EventSource error:', error)
      setConnectionStatus('disconnected')
      setIsRunning(false)
      eventSource.close()
    }
  }

  const stopTest = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsRunning(false)
    setConnectionStatus('disconnected')
    addLog('info', '⏹️ Test stopped by user')
  }

  const clearLogs = () => {
    setLogs([])
    setResults(null)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px', 
      backgroundColor: '#0a0a0a', 
      color: '#00ff00', 
      minHeight: '100vh' 
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px'
      }}>
        <h1 style={{ color: '#ffffff', margin: 0, marginRight: '20px' }}>
          🔴 REAL-TIME PersonalityEngine Execution Monitor
        </h1>
        <div style={{
          padding: '5px 10px',
          borderRadius: '15px',
          fontSize: '12px',
          fontWeight: 'bold',
          backgroundColor: 
            connectionStatus === 'connected' ? '#004400' : 
            connectionStatus === 'connecting' ? '#444400' : '#440000',
          color: 
            connectionStatus === 'connected' ? '#00ff00' : 
            connectionStatus === 'connecting' ? '#ffff00' : '#ff0000'
        }}>
          {connectionStatus === 'connected' ? '🟢 LIVE' : 
           connectionStatus === 'connecting' ? '🟡 CONNECTING' : '🔴 OFFLINE'}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startRealTimeTest}
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#666' : '#ff0000',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            marginRight: '10px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? '⏳ RUNNING LIVE TEST...' : '🚀 START REAL-TIME TEST'}
        </button>

        {isRunning && (
          <button 
            onClick={stopTest}
            style={{
              backgroundColor: '#cc0000',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '5px',
              marginRight: '10px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ⏹️ STOP
          </button>
        )}

        <button 
          onClick={clearLogs}
          disabled={isRunning}
          style={{
            backgroundColor: '#666',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ CLEAR
        </button>
      </div>

      <div style={{
        backgroundColor: '#000000',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '20px',
        height: '500px',
        overflowY: 'auto',
        marginBottom: '20px',
        fontFamily: 'Consolas, Monaco, monospace'
      }}>
        <div style={{ 
          color: '#888', 
          marginBottom: '15px',
          borderBottom: '1px solid #333',
          paddingBottom: '10px'
        }}>
          === LIVE EXECUTION STREAM ===
          {isRunning && <span style={{ color: '#ff0000', marginLeft: '10px' }}>● RECORDING</span>}
        </div>
        
        {logs.length === 0 && !isRunning && (
          <div style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>
            🎬 Ready to stream live execution...<br/>
            Click "START REAL-TIME TEST" to begin monitoring actual PersonalityEngine calls
          </div>
        )}

        {logs.map((log, index) => (
          <div key={index} style={{
            marginBottom: '8px',
            padding: '4px 8px',
            borderRadius: '3px',
            backgroundColor: 
              log.level === 'error' ? '#330000' : 
              log.level === 'success' ? '#003300' :
              log.level === 'debug' ? '#111111' : 'transparent',
            color: 
              log.level === 'error' ? '#ff6666' : 
              log.level === 'success' ? '#66ff66' :
              log.level === 'debug' ? '#999999' : '#00ff00'
          }}>
            <span style={{ color: '#666' }}>[{log.timestamp}]</span> {log.message}
            {log.data && (
              <details style={{ marginTop: '5px', marginLeft: '20px' }}>
                <summary style={{ cursor: 'pointer', color: '#888' }}>
                  📋 View Data
                </summary>
                <pre style={{ 
                  fontSize: '11px', 
                  color: '#ccc',
                  backgroundColor: '#111',
                  padding: '10px',
                  borderRadius: '3px',
                  marginTop: '5px',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                </pre>
              </details>
            )}
          </div>
        ))}
        
        {isRunning && logs.length === 0 && (
          <div style={{ color: '#ffff00', textAlign: 'center' }}>
            ⏳ Establishing connection and starting tests...
          </div>
        )}
        
        <div ref={logsEndRef} />
      </div>

      {results && (
        <div style={{
          backgroundColor: '#001100',
          border: '2px solid #00ff00',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ color: '#00ff00', marginBottom: '15px', borderBottom: '1px solid #00ff00', paddingBottom: '5px' }}>
            📊 LIVE EXECUTION RESULTS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
            <div>
              <strong style={{ color: '#66ff66' }}>⏱️ Generation Time:</strong> {results.metadata?.generationTime}ms
            </div>
            <div>
              <strong style={{ color: '#66ff66' }}>🔤 Tokens Used:</strong> {results.metadata?.tokensUsed}
            </div>
            <div>
              <strong style={{ color: '#66ff66' }}>🎯 Confidence:</strong> {(results.metadata?.confidenceScore * 100).toFixed(1)}%
            </div>
            <div>
              <strong style={{ color: '#66ff66' }}>📝 Version:</strong> {results.metadata?.personalityVersion}
            </div>
          </div>
          
          {results.content?.introduction && (
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#66ff66' }}>📄 Generated Introduction:</strong>
              <div style={{ 
                backgroundColor: '#002200', 
                padding: '10px', 
                borderRadius: '5px', 
                marginTop: '5px',
                color: '#ccffcc',
                fontStyle: 'italic'
              }}>
                "{results.content.introduction}"
              </div>
            </div>
          )}

          <details>
            <summary style={{ cursor: 'pointer', color: '#00ff00', marginBottom: '10px' }}>
              🔍 View Full Results JSON
            </summary>
            <pre style={{ 
              color: '#cccccc', 
              fontSize: '11px',
              whiteSpace: 'pre-wrap',
              maxHeight: '400px',
              overflowY: 'auto',
              backgroundColor: '#111',
              padding: '15px',
              borderRadius: '5px'
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#330000', 
        border: '2px solid #ff0000',
        borderRadius: '8px'
      }}>
        <strong style={{ color: '#ff6666' }}>⚠️ LIVE EXECUTION WARNING:</strong>
        <div style={{ color: '#ffcccc', marginTop: '10px', lineHeight: '1.5' }}>
          This monitor shows REAL-TIME execution of the PersonalityEngine:
          <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>• Makes actual HTTP calls to Amazon Bedrock API</li>
            <li>• Uses real AWS credentials and incurs actual costs</li>
            <li>• Shows genuine response times and token usage</li>
            <li>• Displays actual generated content from Claude</li>
            <li>• Reveals real errors, failures, and stack traces</li>
            <li>• Streams live data as it happens (no mocking)</li>
          </ul>
          <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
            🎯 This proves whether the PersonalityEngine actually works or not.
          </div>
        </div>
      </div>
    </div>
  )
}